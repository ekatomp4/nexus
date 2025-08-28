const tf = require("@tensorflow/tfjs");
const fs = require("fs");
const path = require("path");

class TextToTextModel {
  constructor(name = "TextToTextModel", modelPath = "./backend/tools/tensors/data") {
    this.modelPath = modelPath;
    this.name = name;
    this.model = null;
    this.vocab = {};         // token -> index
    this.reverseVocab = {};  // index -> token
    this.wordIndex = 1;
    this.MAXLEN = 10;
  }

  tokenize(trainingData) {
    this.vocab = {};
    this.reverseVocab = {};
    this.wordIndex = 1;

    for (let text of trainingData) {
      const words = text.toLowerCase().split(/\s+/);
      for (let word of words) {
        if (!(word in this.vocab)) {
          this.vocab[word] = this.wordIndex;
          this.reverseVocab[this.wordIndex] = word;
          this.wordIndex++;
        }
      }
    }

    this.vocab["<END>"] = this.wordIndex;
    this.reverseVocab[this.wordIndex] = "<END>";
  }

  textToTensor(text) {
    const tokens = text.toLowerCase().split(/\s+/).map(w => this.vocab[w] || 0);
    const padded = new Array(this.MAXLEN).fill(0);
    for (let i = 0; i < Math.min(tokens.length, this.MAXLEN); i++) padded[i] = tokens[i];
    return tf.tensor2d([padded]);
  }
  async train(trainingData, epochs = 50) {
    // Build vocab from all inputs and outputs
    const allText = trainingData.flatMap(pair => pair); // [input, output] => [input, output]
    this.tokenize(allText);
  
    const xs = [];
    const ys = [];
  
    for (let [input, output] of trainingData) {
      const inputWords = input.toLowerCase().split(/\s+/);
      const outputWords = output.toLowerCase().split(/\s+/).concat(["<END>"]);
  
      // autoregressive style: predict next word from previous words (but per example)
      for (let i = 0; i < outputWords.length; i++) {
        const context = inputWords.concat(outputWords.slice(0, i));
        const padded = new Array(this.MAXLEN).fill(0);
        for (let j = 0; j < Math.min(context.length, this.MAXLEN); j++) {
          padded[j] = this.vocab[context[context.length - this.MAXLEN + j]] || 0;
        }
        xs.push(padded);
  
        const y = new Array(this.wordIndex + 1).fill(0);
        y[this.vocab[outputWords[i]]] = 1;
        ys.push(y);
      }
    }
  
    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor2d(ys);
  
    this.model = tf.sequential();
    this.model.add(tf.layers.embedding({ inputDim: this.wordIndex + 2, outputDim: 16, inputLength: this.MAXLEN }));
    this.model.add(tf.layers.flatten());
    this.model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    this.model.add(tf.layers.dense({ units: this.wordIndex + 1, activation: "softmax" }));
  
    this.model.compile({ optimizer: "adam", loss: "categoricalCrossentropy", metrics: ["accuracy"] });
  
    console.log("Training autoregressive model...");
    await this.model.fit(xsTensor, ysTensor, { epochs, verbose: 0 });
    console.log("Model trained");
  }
  

  async generate(text, maxTokens = 20, stopToken = "<END>") {
    if (!this.model) throw new Error("Model not trained or loaded.");
    let currentText = text.toLowerCase();
    const result = currentText.split(/\s+/);

    for (let i = 0; i < maxTokens; i++) {
      const inputTensor = this.textToTensor(currentText);
      const prediction = this.model.predict(inputTensor);
    //   console.log(prediction);
      const data = await prediction.data();
      const nextIndex = data.indexOf(Math.max(...data));
      const nextWord = this.reverseVocab[nextIndex];

      if (nextWord === stopToken) break;

      result.push(nextWord);
      currentText = result.slice(-this.MAXLEN).join(" ");
    }

    return result.join(" ");
  }
}

module.exports = TextToTextModel;
