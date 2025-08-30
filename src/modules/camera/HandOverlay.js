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
const tuckedThreshold = 40;
const openThreshold = 60;

const gestureList = {
  Pinch: {
    distances: [
      { start: "thumb_tip", end: "index_finger_tip", max: 25 }, // max percent of hand size
    ],
    priority: 3,
  },
  "Fingers Down": {
    distances: [
      { start: "index_finger_tip", end: "index_finger_mcp", max: 25 },
      { start: "middle_finger_tip", end: "middle_finger_mcp", max: 25 },
      { start: "ring_finger_tip", end: "ring_finger_mcp", max: 25 },
      { start: "pinky_finger_tip", end: "pinky_finger_mcp", max: 25 },
      { start: "thumb_tip", end: "index_finger_dip", max: 35}
    ],
    priority: 1,
  },
  "Fist": {
    distances: [
      { start: "pinky_finger_tip", end: "wrist", max: 60 },
      { start: "index_finger_tip", end: "thumb_cmc", max: 70 },
      { start: "middle_finger_tip", end: "wrist", max: 40 },
      { start: "ring_finger_tip", end: "wrist", max: 50 },
      { start: "thumb_tip", end: "index_finger_dip", max: 35}
    ],
    priority: 4,
  },
  // numbers
  "One": {
    distances: [
      { start: "index_finger_tip", end: "wrist", min: openThreshold-5 }, // open
      { start: "middle_finger_tip", end: "wrist", max: tuckedThreshold+15 }, // tucked
      { start: "ring_finger_tip", end: "wrist", max: tuckedThreshold }, // tucked
      { start: "pinky_finger_tip", end: "wrist", max: tuckedThreshold }, // tucked
      { start: "thumb_tip", end: "middle_finger_pip", max: 40 }, // tucked
    ],
    priority: 2,
  },
  "Two": {
    distances: [
      { start: "index_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "middle_finger_tip", end: "wrist", min: openThreshold+10 }, // open
      { start: "ring_finger_tip", end: "wrist", max: tuckedThreshold+10 }, // tucked
      { start: "pinky_finger_tip", end: "wrist", max: tuckedThreshold+10 }, // tucked
      { start: "thumb_tip", end: "ring_finger_pip", max: 50 }, // tucked
    ],
    priority: 2,
  },
  "Three": {
    distances: [
      { start: "index_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "middle_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "ring_finger_tip", end: "wrist", min: openThreshold-10 }, // open
      { start: "pinky_finger_tip", end: "wrist", max: tuckedThreshold+5 }, // tucked
      { start: "thumb_tip", end: "pinky_finger_pip", max: 60 }, // tucked
    ],
    priority: 2,
  },
  "Four": {
    distances: [
      { start: "index_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "middle_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "ring_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "pinky_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "thumb_tip", end: "ring_finger_mcp", max: 40 }, // tucked
    ],
    priority: 2,
  },
  "Five": {
    distances: [
      { start: "index_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "middle_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "ring_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "pinky_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "thumb_tip", end: "wrist", min: 40 }, // open
    ],
    priority: 1,
  },

  "Circle": {
    distances: [
      { start: "index_finger_tip", end: "thumb_tip", max: 25 },
      { start: "middle_finger_tip", end: "thumb_tip", max: 30 },
      { start: "ring_finger_tip", end: "thumb_tip", max: 35 },
      { start: "pinky_finger_tip", end: "thumb_tip", max: 40 },
    ],
    priority: 4,
  },

  "Wolf": {
    distances: [
      { start: "index_finger_tip", end: "wrist", min: openThreshold }, // open
      { start: "middle_finger_tip", end: "wrist", max: tuckedThreshold+10 }, // tucked
      { start: "ring_finger_tip", end: "wrist", max: tuckedThreshold+10 }, // tucked
      { start: "pinky_finger_tip", end: "wrist", min: openThreshold }, // open
    ],
    priority: 4,
  },

  "Middle Finger": {
    distances: [
      { start: "index_finger_tip", end: "wrist", max: tuckedThreshold+30 }, // tucked
      { start: "middle_finger_tip", end: "wrist", min: openThreshold+5 }, // open
      { start: "ring_finger_tip", end: "wrist", max: tuckedThreshold+15 }, // tucked
      { start: "pinky_finger_tip", end: "wrist", max: tuckedThreshold+15 }, // tucked
    ],
    priority: 4,  
  },

  "Thumb": {
    distances: [
      { start: "index_finger_tip", end: "wrist", max: tuckedThreshold+15 }, // tucked
      { start: "middle_finger_tip", end: "wrist", max: tuckedThreshold+15 }, // tucked
      { start: "ring_finger_tip", end: "wrist", max: tuckedThreshold+15 }, // tucked
      { start: "pinky_finger_tip", end: "wrist", max: tuckedThreshold+15 }, // tucked
      { start: "thumb_tip", end: "wrist", min: 40 }, // open 
      { start: "thumb_tip", end: "index_finger_dip", min: 35}
    ],
    priority: 3,  
  }

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

let overlayCtx = null;
let handSize = 20;

function getGestures(hands) {
  const result = { left: null, right: null };

  hands.forEach((hand) => {
    const handSide = hand.handedness.toLowerCase(); // "left" or "right"
    let highestPriority = -1;

    // Find and validate keypoint references
    const wrist = hand.keypoints.find((kp) => kp.name === "wrist");
    const thumbCmc = hand.keypoints.find(
      (kp) => kp.name === "thumb_cmc"
    );
    if (!wrist || !thumbCmc) return;

    // Calculate hand size (distance from wrist to thumb cmc x 1.5)
    handSize = dist2D(wrist, thumbCmc) * 4;

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
        const dist = dist3D(startKp, endKp);
        // const dist = dist2D(startKp, endKp);
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



const HandOverlay = {
  positionCtx: null,
  positionOverlay: null,
  camera: null,

  // Maximum number of same gesture detections required to trigger an action
  MAX_CONSECUTIVE_GESTURES: 30,

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


  midX: null,
  midY: null,

  gestureHistory: { left: [], right: [] }, // track recent gestures for each hand

  init: function (camera) {
    this.positionOverlay = document.getElementById("positionOverlay");
    this.positionCtx = this.positionOverlay.getContext("2d");
    overlayCtx = this.positionCtx;
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
        if (this.gestureHistory[LoR].length > this.MAX_CONSECUTIVE_GESTURES) {
          this.gestureHistory[LoR].shift(); // keep only the last N
        }

        // --- Multi-verification check ---

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
        let majorityGesture = this.gestureHistory[LoR].reduce(
          (acc, cur) => {
            acc[cur] = (acc[cur] || 0) + 1;
            if (acc[cur] > acc.majority) {
              acc.majority = acc[cur];
              acc.majorityGesture = cur;
            }
            return acc;
          },
          { majority: 0, majorityGesture: null }
        ).majorityGesture;

        if(majorityGesture) {
          currentGestures[LoR] = majorityGesture;
          this.handleAction(LoR, majorityGesture, hand, scaleX, scaleY);
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

        // draw line from wrist upwards handsize
        const wrist = hand.keypoints.find((kp) => kp.name === "wrist");
        ctx.strokeStyle = "white";
        ctx.globalAlpha = 0.2;
        const scaledHandSize = handSize * scaleY;
        ctx.moveTo(wrist.x * scaleX, wrist.y * scaleY);
        ctx.lineTo(wrist.x * scaleX, wrist.y * scaleY - scaledHandSize);
        ctx.stroke();

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

          if(Date.now() % 2 == 0) {
            window.controller.moveMouse(midX, midY);
          }

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

        ctx.fillStyle = "green";
        break;

      case "Fingers Down":
        ctx.fillStyle = "blue";
        break;

      case "Fist":
        ctx.fillStyle = "yellow";
        break;

      // nums
      case "One":
        ctx.fillStyle = "pink";
        break;
      case "Two":
        ctx.fillStyle = "purple";
        break;
      case "Three":
        ctx.fillStyle = "lightblue";
        break;
      case "Four":
        ctx.fillStyle = "orange";
        break;
      case "Five":
        ctx.fillStyle = "lightgreen";
        break;
        
      case "Circle":
        ctx.fillStyle = "cyan";
        break;

      case "Wolf":
        ctx.fillStyle = "white"
        break;

      case "Middle Finger":
        ctx.fillStyle = "brown";
        break;

      case "Thumb":
        ctx.fillStyle = "grey";
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
