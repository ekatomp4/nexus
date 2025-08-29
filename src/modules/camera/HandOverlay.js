/*
0: wrist
1: thumb_cmc
2: thumb_mcp
3: thumb_ip
4: thumb_tip
5: index_finger_mcp
6: index_finger_pip
7: index_finger_dip
8: index_finger_tip
9: middle_finger_mcp
10: middle_finger_pip
11: middle_finger_dip
12: middle_finger_tip
13: ring_finger_mcp
14: ring_finger_pip
15: ring_finger_dip
16: ring_finger_tip
17: pinky_finger_mcp
18: pinky_finger_pip
19: pinky_finger_dip
20: pinky_finger_tip
*/

const bones = [
  // Thumb
  ["wrist", "thumb_cmc"],
  ["thumb_cmc", "thumb_mcp"],
  ["thumb_mcp", "thumb_ip"],
  ["thumb_ip", "thumb_tip"],
  // Index
  ["wrist", "index_finger_mcp"],
  ["index_finger_mcp", "index_finger_pip"],
  ["index_finger_pip", "index_finger_dip"],
  ["index_finger_dip", "index_finger_tip"],
  // Middle
  ["wrist", "middle_finger_mcp"],
  ["middle_finger_mcp", "middle_finger_pip"],
  ["middle_finger_pip", "middle_finger_dip"],
  ["middle_finger_dip", "middle_finger_tip"],
  // Ring
  ["wrist", "ring_finger_mcp"],
  ["ring_finger_mcp", "ring_finger_pip"],
  ["ring_finger_pip", "ring_finger_dip"],
  ["ring_finger_dip", "ring_finger_tip"],
  // Pinky
  ["wrist", "pinky_finger_mcp"],
  ["pinky_finger_mcp", "pinky_finger_pip"],
  ["pinky_finger_pip", "pinky_finger_dip"],
  ["pinky_finger_dip", "pinky_finger_tip"],
];

// Hardcoded gestures with priority
const gestureList = {
  Pinch: {
    distances: [
      { start: "thumb_tip", end: "index_finger_tip", max: 20 }, // max percent of hand size
    ],
    priority: 1,
  },
  "Fingers Down": {
    distances: [
      { start: "index_finger_tip", end: "index_finger_mcp", max: 25 },
      { start: "middle_finger_tip", end: "middle_finger_mcp", max: 25 },
      { start: "ring_finger_tip", end: "ring_finger_mcp", max: 25 },
      { start: "pinky_finger_tip", end: "pinky_finger_mcp", max: 25 },
      { start: "thumb_tip", end: "index_finger_tip", min: 25 },
    ],
    priority: 2,
  },
  // "Fist": {
  //     distances: [
  //         // { start: "index_finger_dip", end: "index_finger_mcp", max: 20 },
  //         // { start: "middle_finger_dip", end: "middle_finger_mcp", max: 20 },
  //         // { start: "ring_finger_dip", end: "ring_finger_mcp", max: 20 },
  //         // { start: "pinky_finger_dip", end: "pinky_finger_mcp", max: 20 },
  //         { start: "index_finger_tip", end: "thumb_mcp", max: 30 },
  //         // { start: "middle_finger_tip", end: "thumb_mcp", max: 30 },
  //         // { start: "ring_finger_tip", end: "thumb_mcp", max: 40 },
  //         { start: "thumb_tip", end: "index_finger_pip", max: 25 },
  //     ],
  //     priority: 3
  // },
  // "Spread": {
  //     distances: [
  //         { start: "thumb_tip", end: "pinky_finger_tip", min: 60 } // min percent of hand size
  //     ],
  //     priority: 0
  // }
};

// 3D distance helper
function dist3D(kp1, kp2) {
  const dx = kp1.x - kp2.x;
  const dy = kp1.y - kp2.y;
  const dz = (kp1.z || 0) - (kp2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function dist2D(kp1, kp2) {
  const dx = kp1.x - kp2.x;
  const dy = kp1.y - kp2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getGestures(hands) {
  const result = { left: null, right: null };

  hands.forEach((hand) => {
    const handSide = hand.handedness.toLowerCase(); // "left" or "right"
    let highestPriority = -1;

    // Find and validate keypoint references
    const wrist = hand.keypoints.find((kp) => kp.name === "wrist");
    const middleTip = hand.keypoints.find(
      (kp) => kp.name === "middle_finger_tip"
    );
    if (!wrist || !middleTip) return;

    // Calculate hand size (distance from wrist to middle finger tip)
    const handSize = dist3D(wrist, middleTip);

    // Iterate over all gestures
    for (const gesture in gestureList) {
      const distances = gestureList[gesture].distances;
      let matches = true;

      // Iterate over all distances that must match for this gesture
      for (const d of distances) {
        const startKp = hand.keypoints.find((kp) => kp.name === d.start);
        const endKp = hand.keypoints.find((kp) => kp.name === d.end);

        // If any keypoint is missing, this gesture doesn't match
        if (!startKp || !endKp) {
          matches = false;
          break;
        }

        // Check if distance is within bounds
        // const dist = dist3D(startKp, endKp);
        const dist = dist2D(startKp, endKp);
        if (
          (d.min !== undefined && dist < (d.min / 100) * handSize) ||
          (d.max !== undefined && dist > (d.max / 100) * handSize)
        ) {
          matches = false;
          break;
        }
      }

      // If all distances match and priority is higher than current highest,
      // set this gesture as the result
      if (matches && gestureList[gesture].priority > highestPriority) {
        result[handSide] = gesture;
        highestPriority = gestureList[gesture].priority;
      }
    }
  });

  return result;
}

function getHandRotation(hand, sameRotation = true) {
  if (!hand) return 0;

  const wrist = hand.keypoints.find((kp) => kp.name === "wrist");
  const thumbCmc = hand.keypoints.find((kp) => kp.name === "thumb_cmc");
  if (!wrist || !thumbCmc) return 0;

  // For right hand, mirror X so both hands have same forward orientation
  let dx = thumbCmc.x - wrist.x;
  let dy = thumbCmc.y - wrist.y;

  if (hand.handedness === "Right") dx = -dx;

  // Angle relative to horizontal
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Normalize -180..180
  angle = ((angle + 180) % 360) - 180;

  if (sameRotation) {
    if (hand.handedness === "Right") angle = -angle;
    // Left hand stays the same
  }

  return angle | 0;
}

// Maximum number of same gesture detections required to trigger an action
const REQUIRED_CONSECUTIVE_GESTURES = 3;

const HandOverlay = {
  positionCtx: null,
  positionOverlay: null,
  camera: null,

  currentPositions: { left: null, right: null }, // current 2D position of each hand
  currentRotations: { left: null, right: null }, // current rotation of each hand in degrees
  currentDistances: { left: null, right: null }, // current distance between hands in pixels

  originalPinchedPositions: { left: null, right: null }, // original position of each hand on pinch
  originalPinchedRotations: { left: null, right: null }, // original rotation of each hand on pinch
  originalPinchedDistances: { left: null, right: null }, // original distance between hands on pinch

  currentPositionChange: { left: null, right: null }, // change in position since last update
  currentRotationChange: { left: null, right: null }, // change in rotation since last update
  currentDistanceChange: { left: null, right: null }, // change in distance since last update

  currentGestures: { left: null, right: null }, // holds the current gesture
  lastGestures: { left: null, right: null }, // holds the last gestures
  gestureTimeouts: { left: 0, right: 0 }, // current timeouts
  maxGestureTimeout: 5, // updates it takes for gesture to expire

  midX: null,
  midY: null,

  gestureHistory: { left: [], right: [] }, // track recent gestures for each hand

  init: function (camera) {
    this.positionOverlay = document.getElementById("positionOverlay");
    this.positionCtx = this.positionOverlay.getContext("2d");
    this.camera = camera;

    this.drawHandPoints = () => {
      const ctx = this.positionCtx;
      const camera = this.camera;
      const hands = camera.hands;

      const video = camera.video;
      const overlay = this.positionOverlay;

      const scaleX = overlay.width / video.videoWidth;
      const scaleY = overlay.height / video.videoHeight;

      ctx.clearRect(0, 0, overlay.width, overlay.height);
      ctx.fillStyle = "red";

      const gestures = getGestures(hands);

      let detectedHands = { left: false, right: false };

      hands.forEach((hand) => {
        const LoR = hand.handedness === "Left" ? "left" : "right";

        detectedHands[LoR] = true;

        // update positions
        if (this.midX && this.midY) {
          this.currentPositions[LoR] = {
            x: this.midX,
            y: this.midY,
          };
        }
        this.currentRotations[LoR] = getHandRotation(hand);
        this.currentDistances[LoR] = this.getDistanceFromCamera(hand);

        // --- Update gesture history ---
        if (!this.gestureHistory[LoR]) this.gestureHistory[LoR] = [];
        this.gestureHistory[LoR].push(gestures[LoR]);
        // shift
        if (this.gestureHistory[LoR].length > REQUIRED_CONSECUTIVE_GESTURES) {
          this.gestureHistory[LoR].shift(); // keep only the last N
        }

        // --- Multi-verification check ---
        let allSame = this.gestureHistory[LoR].every(
          (g) => g === gestures[LoR] && g !== null
        );
        if (this.gestureHistory[LoR].some((g) => g === null)) {
          allSame = false;
        }

        let currentGestures = {};

        // set changes
        if (this.originalPinchedDistances[LoR]) {
          this.currentDistanceChange[LoR] =
            this.currentDistances[LoR] - this.originalPinchedDistances[LoR];
        }
        if (this.originalPinchedRotations[LoR]) {
          this.currentRotationChange[LoR] =
            this.currentRotations[LoR] - this.originalPinchedRotations[LoR];
        }
        if (this.originalPinchedPositions[LoR]) {
          this.currentPositionChange[LoR] = {
            x:
              this.currentPositions[LoR].x -
              this.originalPinchedPositions[LoR].x,
            y:
              this.currentPositions[LoR].y -
              this.originalPinchedPositions[LoR].y,
          };
        }

        // --- Handle action ---
        if (allSame) {
          this.lastGestures[LoR] = gestures[LoR];
          this.handleAction(LoR, gestures[LoR], hand, scaleX, scaleY);
          currentGestures[LoR] = gestures[LoR];
          this.gestureTimeouts[LoR] = 0;
        } else if (
          this.lastGestures[LoR] &&
          this.gestureTimeouts[LoR] < this.maxGestureTimeout
        ) {
          this.gestureTimeouts[LoR]++;
          this.handleAction(LoR, gestures[LoR], hand, scaleX, scaleY);
          currentGestures[LoR] = this.lastGestures[LoR];
        } else {
          currentGestures[LoR] = null;
          // set origins
          if (gestures[LoR] != "Pinch") {
            // reset
            this.originalPinchedPositions[LoR] = null;
            this.originalPinchedRotations[LoR] = null;
            this.originalPinchedDistances[LoR] = null;
            this.currentPositionChange[LoR] = null;
            this.currentRotationChange[LoR] = null;
            this.currentDistanceChange[LoR] = null;
          }
        }

        // --- Draw keypoints ---
        // Draw wiremesh for this hand
        ctx.strokeStyle = currentGestures[LoR] ? "green" : "red";
        ctx.lineWidth = 5;

        ctx.globalAlpha = 0.3;
        bones.forEach(([startName, endName]) => {
          const startKp = hand.keypoints.find((kp) => kp.name === startName);
          const endKp = hand.keypoints.find((kp) => kp.name === endName);
          if (!startKp || !endKp) return;

          const startX = startKp.x * scaleX;
          const startY = startKp.y * scaleY;
          const endX = endKp.x * scaleX;
          const endY = endKp.y * scaleY;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
        // keypoints
        hand.keypoints.forEach((kp) => {
          // if(!kp.name.includes("tip")) return;
          // ctx.fillText(kp.name, kp.x * scaleX + 10, kp.y * scaleY);
          const x = kp.x * scaleX;
          const y = kp.y * scaleY;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = currentGestures[LoR] ? "green" : "red";
          ctx.fill();
        });
      });

      // remove hand positions
      if (!detectedHands.left) {
        this.currentPositions.left = null;
        this.currentRotations.left = null;
        this.currentDistances.left = null;
      }
      if (!detectedHands.right) {
        this.currentPositions.right = null;
        this.currentRotations.right = null;
        this.currentDistances.right = null;
      }

      // frame again
      requestAnimationFrame(this.drawHandPoints);
    };

    this.drawHandPoints();
  },

  // --- Handles actions once a gesture passes multi-verification ---
  handleAction: function (handSide, gesture, hand, scaleX, scaleY) {
    const ctx = this.positionCtx;
    const overlay = this.positionOverlay;

    switch (gesture) {
      case "Pinch":
        // set gesture
        this.currentGestures[handSide] = gesture;
        // action
        ctx.fillStyle = "green";

        const index = hand.keypoints.find(
          (kp) => kp.name === "index_finger_tip"
        );
        const thumb = hand.keypoints.find((kp) => kp.name === "thumb_tip");

        if (index && thumb) {
          const rect = overlay.getBoundingClientRect();
          const indexX = index.x * scaleX + rect.left;
          const indexY = index.y * scaleY + rect.top;
          const thumbX = thumb.x * scaleX + rect.left;
          const thumbY = thumb.y * scaleY + rect.top;

          // Midpoint between thumb and index
          const midX = (indexX + thumbX) / 2;
          const midY = (indexY + thumbY) / 2;

          this.midX = midX;
          this.midY = midY;

          // Draw circle at midpoint
          ctx.fillStyle = "orange";
          ctx.beginPath();
          ctx.arc(midX, midY, 5, 0, 2 * Math.PI);
          ctx.fill();

          // get element at position
          const element = document.elementFromPoint(midX, midY);
          if (element) {
            const clickEvent = new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              view: window,
            });
            element.dispatchEvent(clickEvent);
          }

          // set vars
          if (!this.originalPinchedDistances[handSide]) {
            this.originalPinchedDistances[handSide] =
              this.currentDistances[handSide];
            this.originalPinchedPositions[handSide] = { x: midX, y: midY };
            this.originalPinchedRotations[handSide] =
              this.currentRotations[handSide];
          }
        }
        break;

      case "Fingers Down":
        // Example: you could trigger a scroll or a selection here
        ctx.fillStyle = "blue";
        break;

      default:
        ctx.fillStyle = "red";
    }
  },

  // TODO global setting for handSize (bottom of thuimb to other side of wrist bone)
  getDistanceFromCamera: function (
    hand,
    videoHeight = 120,
    knownLengthInches = 2
  ) {
    if (!hand) return null;

    // Get wrist and thumb_cmc keypoints
    const wrist = hand.keypoints.find((kp) => kp.name === "wrist");
    const thumbCmc = hand.keypoints.find((kp) => kp.name === "thumb_cmc");
    if (!wrist || !thumbCmc) return null;

    // Pixel distance in image
    const pixelDist = Math.hypot(thumbCmc.x - wrist.x, thumbCmc.y - wrist.y);

    // Approximate field of view: assume vertical FOV of camera (typical webcams ~60°)
    const verticalFOV = (60 * Math.PI) / 180; // in radians

    // Calculate real-world distance from camera using similar triangles
    const handHeightPx = pixelDist; // hand size in pixels
    const sensorHeightPx = videoHeight; // total video height in pixels

    const distanceInches =
      (knownLengthInches * sensorHeightPx) /
      (2 * handHeightPx * Math.tan(verticalFOV / 2));

    return Math.round(distanceInches * 100) / 100;
  },
};

export default HandOverlay;
