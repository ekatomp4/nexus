const tf = require('@tensorflow/tfjs-node');
require('@tensorflow/tfjs-backend-wasm');
const mobilenet = require('@tensorflow-models/mobilenet');
const { createCanvas, Image } = require('canvas');
const fs = require('fs');
const path = require('path');

const imageModel = {
    model: null,

    // Initialize MobileNet and WASM backend
    async init() {
        if (!this.model) {
            await tf.setBackend('wasm');
            await tf.ready();
            this.model = await mobilenet.load();
        }
    },

    // Convert Data URL to tensor
    async dataURLToTensor(dataUrl) {
        const img = new Image();
        img.src = dataUrl;

        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);

        return tf.browser.fromPixels(canvas)
        .expandDims(0)
        .toFloat()
        .div(tf.scalar(127.5))
        .sub(tf.scalar(1));
    },

    
    async getObjectsFromCanvas(canvas) {
        await this.init();
        const predictions = await this.model.classify(canvas);
        return predictions;
    },

    // Get objects from a Data URL
    async getObjectsFromDataURL(dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        return this.getObjectsFromCanvas(canvas);
    },

    // Get objects from a file path
    async getObjectsFromImgPath(imgPath) {
        const img = new Image();
        img.src = imgPath;
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        return this.getObjectsFromCanvas(canvas);
    }
};

module.exports = imageModel;