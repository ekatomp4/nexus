class Camera {
  constructor(videoElement, overlayElement) {
    if (!(videoElement instanceof HTMLVideoElement)) {
      throw new Error("Camera requires a <video> element");
    }
    if (!(overlayElement instanceof HTMLCanvasElement)) {
      throw new Error("Camera requires a <canvas> element for overlay");
    }

    this.video = videoElement;
    this.overlay = overlayElement;
    this.showOverlay = true;
    this.stream = null;
    this.running = false;
    this._frameRequest = null;

    this.handRefreshRate = 2; // min 1 

    this.tick = 0;
    this.hands = []; // TODO make hands dissapear after a certain amount of time instead of dissapearing immerdietly
    this.detector = null;

    // ===== Filters =====
    this.filters = ["grayscale(100%)", "brightness(50%)"]; // Example: ['grayscale(100%)']

    this.ctx = this.overlay.getContext("2d", { willReadFrequently: true });
  }

  // HANDS

  drawHands(hands) {
    const ctx = this.ctx;
    const canvas = this.overlay;

    // flip canvas horizontally
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    // Define finger connections based on your keypoints index
    const fingers = [
      [0, 1, 2, 3, 4], // Thumb
      [0, 5, 6, 7, 8], // Index
      [0, 9, 10, 11, 12], // Middle
      [0, 13, 14, 15, 16], // Ring
      [0, 17, 18, 19, 20], // Pinky
    ];

    hands.forEach((hand) => {
      const LoR = hand.handedness === "Left" ? "left" : "right";
      ctx.fillStyle = LoR === "left" ? "blue" : "red";
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1;

      // Draw points
      // hand.keypoints.forEach((kp) => {
      //   ctx.beginPath();
      //   ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
      //   ctx.fill();
      // });

      // Draw connections
      fingers.forEach((finger) => {
        for (let i = 0; i < finger.length - 1; i++) {
          const startKp = hand.keypoints[finger[i]];
          const endKp = hand.keypoints[finger[i + 1]];
          if (!startKp || !endKp) continue;
          ctx.beginPath();
          ctx.moveTo(startKp.x, startKp.y);
          ctx.lineTo(endKp.x, endKp.y);
          ctx.stroke();
        }
      });
    });

    ctx.restore();
  }

  async createDetector() {
    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {
      runtime: "mediapipe",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands", // TODO instal this
      modelType: "lite",
    };
    this.detector = await handPoseDetection.createDetector(
      model,
      detectorConfig
    );
    return this.detector;
  }

  async runHands() {
    if (!this.detector) return;

    if (this.tick % this.handRefreshRate === 0) {
      this.hands = await this.detector.estimateHands(this.video, {
        flipHorizontal: true,
      });
    }

    if (this.hands.length > 0) {
      this.drawHands(this.hands);
    }

    this.tick++;
    if (this.tick > 1000) {
      this.tick = 0;
    }
  }

  // normal functionality

  async start(constraints = { video: true, audio: false }) {
    try {
      constraints.video = { width: 160, height: 120 }; // low-res
      // TODO options for different qualities
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;

      await this.video.play();

      // Set overlay size after metadata
      this.overlay.width = this.video.videoWidth;
      this.overlay.height = this.video.videoHeight;

      this.running = true;

      this._applyFilters();
      await this.createDetector();

      this._processFrame();
    } catch (err) {
      console.error("Error accessing camera:", err);
      throw err;
    }
  }

  // Apply the filters array to the video element
  _applyFilters() {
    this.overlay.style.backdropFilter = this.filters.join(" ");
  }

  // add a filter dynamically
  addFilter(filter) {
    this.filters.push(filter);
    this._applyFilters();
  }

  removeFilter(filter) {
    this.filters = this.filters.filter((f) => f !== filter);
    this._applyFilters();
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.video.srcObject = null;
    }
    this.running = false;
    if (this._frameRequest) cancelAnimationFrame(this._frameRequest);
  }

  _processFrame() {
    if (!this.running) return;

    const ctx = this.ctx;
    const w = this.overlay.width;
    const h = this.overlay.height;

    // clear + edge detection
    ctx.clearRect(0, 0, w, h);

    // only draw hands AFTER edges are painted
    this.runHands();

    this._frameRequest = requestAnimationFrame(() => this._processFrame());
  }

  snapshot(includeOverlay = false, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;

    const ctx = canvas.getContext("2d");

    // force resolution resize
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
    if (includeOverlay) {
      ctx.drawImage(this.overlay, 0, 0, canvas.width, canvas.height);
    }

    return canvas.toDataURL("image/png");
  }
}

export default Camera;
