const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");
const path = require("path");

class TextToBitModel {
  constructor(name = "TextToBitModel", modelPath = "./backend/tools/tensors/data") {
    this.modelPath = modelPath;
    this.name = name;
    this.model = null;
    this.vocab = {};
    this.wordIndex = 1;
    this.MAXLEN = 6;
  }

  // Tokenize training data and build vocabulary
  tokenize(trainingData) {
    this.vocab = {};
    this.wordIndex = 1;

    for (let [text] of trainingData) {
      for (let word of text.toLowerCase().split(/\s+/)) {
        if (!(word in this.vocab)) this.vocab[word] = this.wordIndex++;
      }
    }
  }

  textToTensor(text) {
    const tokens = text.toLowerCase().split(/\s+/).map(w => this.vocab[w] || 0);
    const padded = new Array(this.MAXLEN).fill(0);
    for (let i = 0; i < Math.min(tokens.length, this.MAXLEN); i++) {
      padded[i] = tokens[i];
    }
    return tf.tensor2d([padded]);
  }

  async train(trainingData, epochs = 100) {
    this.tokenize(trainingData);

    const xs = [];
    const ys = [];
    for (let [text, label] of trainingData) {
      xs.push(this.textToTensor(text).arraySync()[0]);
      ys.push([label]);
    }

    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor2d(ys);

    this.model = tf.sequential();
    this.model.add(tf.layers.embedding({ inputDim: this.wordIndex + 1, outputDim: 8, inputLength: this.MAXLEN }));
    this.model.add(tf.layers.flatten());
    this.model.add(tf.layers.dense({ units: 8, activation: "relu" }));
    this.model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

    this.model.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"]
    });

    console.log("Training model...");
    await this.model.fit(xsTensor, ysTensor, { epochs, verbose: 0 });
    console.log("Model trained");
  }

  async saveModel() {
    await this.model.save(tf.io.withSaveHandler(async (artifacts) => {
      if (!fs.existsSync(this.modelPath)) fs.mkdirSync(this.modelPath, { recursive: true });

      fs.writeFileSync(path.join(this.modelPath, `${this.name}.json`), JSON.stringify(artifacts.modelTopology));
      fs.writeFileSync(path.join(this.modelPath, `${this.name}weights.json`), JSON.stringify(artifacts.weightSpecs));
      fs.writeFileSync(path.join(this.modelPath, `${this.name}weights.bin`), new Uint8Array(artifacts.weightData));

      return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: "JSON" } };
    }));
  }

  async loadModel() {
    if (!fs.existsSync(path.join(this.modelPath, `${this.name}.json`))) return false;

    const modelTopology = JSON.parse(fs.readFileSync(path.join(this.modelPath, `${this.name}.json`)));
    const weightSpecs = JSON.parse(fs.readFileSync(path.join(this.modelPath, `${this.name}weights.json`)));
    const weightDataBuffer = fs.readFileSync(path.join(this.modelPath, `${this.name}weights.bin`));
    const weightData = weightDataBuffer.buffer.slice(weightDataBuffer.byteOffset, weightDataBuffer.byteOffset + weightDataBuffer.byteLength);

    this.model = await tf.loadLayersModel(tf.io.fromMemory({ modelTopology, weightSpecs, weightData }));
    return true;
  }

  async predict(text) {
    if (!this.model) throw new Error("Model not loaded or trained.");
    const prediction = this.model.predict(this.textToTensor(text));
    const value = (await prediction.data())[0];
    return value > 0.5 ? 1 : 0;
  }
}

module.exports = TextToBitModel;
