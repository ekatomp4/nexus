// const generator = {
//     predict: (z) => {
//         // z is a tensor [1, latentDim]
//         // In a real GAN, we’d apply neural network layers here.
//         // For now, we can just return random noise as a placeholder:
//         const img = tf.randomUniform([1, 64, 64, 3]);
//         return img;
//     }
// };
const generator = tf.sequential();
const latentDim = 100;

generator.add(tf.layers.dense({ units: 8 * 8 * 128, inputShape: [latentDim] }));
generator.add(tf.layers.batchNormalization());
generator.add(tf.layers.leakyReLU());
generator.add(tf.layers.reshape({ targetShape: [8, 8, 128] }));

generator.add(tf.layers.conv2dTranspose({ filters: 64, kernelSize: 4, strides: 2, padding: 'same' }));
generator.add(tf.layers.batchNormalization());
generator.add(tf.layers.leakyReLU());

generator.add(tf.layers.conv2dTranspose({ filters: 32, kernelSize: 4, strides: 2, padding: 'same' }));
generator.add(tf.layers.batchNormalization());
generator.add(tf.layers.leakyReLU());

generator.add(tf.layers.conv2dTranspose({ filters: 3, kernelSize: 4, strides: 2, padding: 'same', activation: 'sigmoid' }));

// const discriminator = {
//     predict: (imgTensor) => {
//         // imgTensor shape: [1, 64, 64, 3]
//         // In a real GAN, we’d apply convolutional layers here.
//         // Placeholder: random probability
//         return tf.randomUniform([1, 1]);
//     }
// };
const discriminator = tf.sequential();

discriminator.add(tf.layers.conv2d({ inputShape: [64, 64, 3], filters: 32, kernelSize: 4, strides: 2, padding: 'same' }));
discriminator.add(tf.layers.leakyReLU());
discriminator.add(tf.layers.dropout({ rate: 0.3 }));

discriminator.add(tf.layers.conv2d({ filters: 64, kernelSize: 4, strides: 2, padding: 'same' }));
discriminator.add(tf.layers.leakyReLU());
discriminator.add(tf.layers.dropout({ rate: 0.3 }));

discriminator.add(tf.layers.flatten());
discriminator.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));




//// training /////

async function trainGAN(generator, discriminator, trainingData, canvas, epochs = 500) {
    const latentDim = 100;

    // Optimizers
    const gOptimizer = tf.train.adam(0.0002);
    const dOptimizer = tf.train.adam(0.0002);

    // Convert trainingData canvases to tensors
    const realImages = trainingData.map(d => tf.browser.fromPixels(d.canvas).toFloat().div(255));
    const realBatch = tf.stack(realImages); // [batch, H, W, C]

    for (let epoch = 0; epoch < epochs; epoch++) {
        tf.tidy(() => {
            // --- Train discriminator ---
            const batchSize = realBatch.shape[0];
            const z = tf.randomNormal([batchSize, latentDim]);
            const fakeImages = generator.predict(z);

            // --- Train discriminator ---
            const dLoss = dOptimizer.minimize(() => {
                const realPred = discriminator.predict(realBatch);
                const fakePred = discriminator.predict(fakeImages);
                const realLoss = tf.losses.sigmoidCrossEntropy(tf.onesLike(realPred), realPred);
                const fakeLoss = tf.losses.sigmoidCrossEntropy(tf.zerosLike(fakePred), fakePred);
                return realLoss.add(fakeLoss);
            }, true); // <-- remove varList

            // --- Train generator ---
            const gLoss = gOptimizer.minimize(() => {
                const z2 = tf.randomNormal([batchSize, latentDim]);
                const generated = generator.predict(z2);
                const pred = discriminator.predict(generated);
                return tf.losses.sigmoidCrossEntropy(tf.onesLike(pred), pred);
            }, true); // <-- remove varList


            if (epoch % 50 === 0) {
                console.log(`Epoch ${epoch}: D Loss: ${dLoss.dataSync()[0].toFixed(3)}, G Loss: ${gLoss.dataSync()[0].toFixed(3)}`);

                // Display a generated image
                const zTest = tf.randomNormal([1, latentDim]);
                const sample = generator.predict(zTest);
                tf.browser.toPixels(sample.squeeze(), canvas);
            }
        });

        await tf.nextFrame(); // let the browser update
    }
}


///// tools ////

const tools = {
    TensorToImage: async (tensor) => {
        // Remove batch dimension if present
        const imageTensor = tensor.squeeze(); // shape: [H, W, C]

        // Create offscreen canvas
        const offCanvas = document.createElement('canvas');
        offCanvas.width = imageTensor.shape[1];
        offCanvas.height = imageTensor.shape[0];
        const ctx = offCanvas.getContext('2d');

        // Draw the tensor to the offscreen canvas
        await tf.browser.toPixels(imageTensor, offCanvas);

        // Get the ImageData
        const imageData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);

        return imageData;
    }
};

const GAN = {
    // vars
    latentDim: 100, // size of the random latent vector
    trainingData: null,
    outputCanvas: null,

    // models
    generator: generator,
    discriminator: discriminator,
    tools: tools,
    // functionality
    
    // use functions
    train(data) {
        // Store original canvases for training
        this.trainingData = data;
    
        // Create output canvas if it doesn’t exist
        if (!this.outputCanvas) {
            this.outputCanvas = document.createElement("canvas");
            this.outputCanvas.style.position = "absolute";
            this.outputCanvas.style.top = "0px";
            this.outputCanvas.style.left = "0px";
            this.outputCanvas.style.border = "2px solid red";
            this.outputCanvas.width = 64;
            this.outputCanvas.height = 64;
            document.body.appendChild(this.outputCanvas);
        }
    
        // Start training
        trainGAN(this.generator, this.discriminator, data, this.outputCanvas);
    },

    // Generate a new image (text input ignored for now)
    predict: async function(inputText = "") {
        // Create output canvas if missing
        if (!this.outputCanvas) {
            this.outputCanvas = document.createElement("canvas");
            this.outputCanvas.style.position = "absolute";
            this.outputCanvas.style.top = "0px";
            this.outputCanvas.style.left = "0px";
            this.outputCanvas.style.border = "2px solid red";
            this.outputCanvas.width = 64;
            this.outputCanvas.height = 64;
            document.body.appendChild(this.outputCanvas);
        }

        // Generate a random latent vector
        const z = tf.randomNormal([1, this.latentDim]);

        // Generate image tensor
        const fakeImage = this.generator.predict(z);

        // Convert tensor to ImageData using tools
        const imageData = await this.tools.TensorToImage(fakeImage);

        // Draw to output canvas
        const ctx = this.outputCanvas.getContext("2d");
        ctx.putImageData(imageData, 0, 0);

        return imageData;
    }
};


export default GAN