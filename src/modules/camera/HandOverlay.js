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

// Hardcoded gestures with priority
const gestureList = {
  "Pinch": {
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

  return angle;
}

// Maximum number of same gesture detections required to trigger an action
const REQUIRED_CONSECUTIVE_GESTURES = 3;

const HandOverlay = {
  positionCtx: null,
  positionOverlay: null,
  camera: null,

  pinchedElement: null,
  originalPinchRotation: null,
  originalPinchPosition: null,

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

      hands.forEach((hand) => {
        const LoR = hand.handedness === "Left" ? "left" : "right";

        // --- Update gesture history ---
        if (!this.gestureHistory[LoR]) this.gestureHistory[LoR] = [];
        this.gestureHistory[LoR].push(gestures[LoR]);
        if (this.gestureHistory[LoR].length > REQUIRED_CONSECUTIVE_GESTURES) {
          this.gestureHistory[LoR].shift(); // keep only the last N
        }

        // --- Multi-verification check ---
        const allSame = this.gestureHistory[LoR].every(
          (g) => g === gestures[LoR] && g !== null
        );
        let currentGestures = {};
        if (allSame) {
          this.handleAction(LoR, gestures[LoR], hand, scaleX, scaleY);
          currentGestures[LoR] = gestures[LoR];
        } else {
          const currentPinched = document.querySelectorAll(".pinched");
          currentPinched.forEach((el) => el.classList.remove("pinched"));
        }
        

        // --- Draw keypoints ---
        hand.keypoints.forEach((kp) => {
          const rotation = getHandRotation(hand);
          ctx.fillText(
            `${hand.handedness} hand rotation: ${rotation?.toFixed(1)}°`,
            10,
            LoR === "left" ? 30 : 50
          );

          if (currentGestures[LoR]) {
            ctx.fillStyle = "green";
          } else {
            ctx.fillStyle = "red";
          }

          const x = kp.x * scaleX;
          const y = kp.y * scaleY;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      });

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

          // Draw circle at midpoint
          ctx.fillStyle = "orange"
          ctx.beginPath();
          ctx.arc(midX, midY, 10, 0, 2 * Math.PI);
          ctx.fill();

          // Check pinchable element at index finger position
          const elems = document.elementsFromPoint(indexX, indexY);
          // remove pinched class from all elements
          // pinchable element
          const pinched = elems.find((el) => el.hasAttribute("data-pinchable"));
          if (pinched) {
            this.pinchedElement = pinched;
            this.originalPinchRotation = getHandRotation(hand);
            this.originalPinchPosition = { x: midX, y: midY };

            this.pinchedElement.classList.add("pinched");
            // this.pinchedElement.style.transform = `scale(1.2)`;
          } else {
            this.pinchedElement = null;
            this.originalPinchRotation = null;
            this.originalPinchPosition = null;
          };
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

    return distanceInches;
  },
};

export default HandOverlay;
