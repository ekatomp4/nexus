const faceapi = require("@vladmandic/face-api");

// can you confirm what is inside C:\wamp64\www\test\node_modules\@tensorflow\tfjs-node\deps
/* does it work if you manualy copy items in 
    C:\wamp64\www\test\node_modules\@tensorflow\tfjs-node\deps\lib 
    C:\wamp64\www\test\node_modules\@tensorflow\tfjs-node\lib
*/

// switch to https://github.com/vladmandic/face-api
const canvas = require("canvas");
const fs = require('fs').promises;

async function recognizeExpressions(imageBuffer) {
    const startTime = Date.now();
  
    const { Canvas, Image, ImageData } = canvas;
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
  
    // Load models
    const modelPath = 'backend/faceModels'; // folder containing manifest + .bin
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
    await faceapi.nets.faceExpressionNet.loadFromDisk(modelPath);
  
    // Load image
    const img = await canvas.loadImage(imageBuffer);
  
    // Detect faces and expressions
    const detectionsWithExpressions = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceExpressions();
  
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    console.log(`Time elapsed: ${(elapsedTime / 1000).toFixed(2)} s`);
  
    return detectionsWithExpressions;
}

const faceModel = {
    async getExpression(data) {
        if (typeof data !== "string") throw new Error("Invalid data, expected string");
    
        let imageBuffer;
    
        if (data.startsWith("data:image")) {
            // Convert base64 dataURL to buffer
            const base64Data = data.split(",")[1];
            imageBuffer = Buffer.from(base64Data, "base64");
        } else {
            // If a file path is provided
            imageBuffer = await fs.readFile(data);
        }
    
        // Await the recognition
        const results = await recognizeExpressions(imageBuffer);
    
        if (!results || results.length === 0) return null;
    
        const expressions = results[0].expressions;
        const predicted = Object.entries(expressions).reduce(
            (a, b) => {
                if (b[0] === "neutral" && b[1] < 0.3) b[1] = 0.2;
                return b[1] > a[1] ? b : a
            }
        );
    
        return {
            results,
            mostLikely: {
                expression: predicted[0],
                probability: predicted[1],
            },
        };
    },
};

module.exports = faceModel