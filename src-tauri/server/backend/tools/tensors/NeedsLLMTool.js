const tf = require("@tensorflow/tfjs-node"); // no -node
const fs = require("fs"); 
const path = require("path");

const MODEL_PATH = "./backend/tools/tensors/data";
const modelJsonPath = path.join(MODEL_PATH, "toolmodel.json");

const trainingData = [
    // ---- true / needs tool ----
    ["Could you please run your lookup tool", 1],
    ["Run lookup tool", 1],
    ["Tool", 1],
    ["Run tool:", 1],
    ["Run function", 1],
    ["Run the function:", 1],
    ["Can you find", 1],
    ["Can you open", 1],
    ["Can you please open", 1],
    ["Could you please find", 1],
    ["Could you please run", 1],
    ["Please run", 1],
    ["What is a", 1],
    ["Execute tool", 1],
    ["Run the process", 1],
    ["Activate the function", 1],
    ["Start the lookup tool", 1],
    ["Could you execute the function for me", 1],
    ["Open the tool", 1],
    ["Check using the tool", 1],
    ["Please execute this function", 1],
    ["Run the code snippet", 1],
    ["Invoke the lookup", 1],
    ["Can you perform the action", 1],
    ["Trigger the tool", 1],
    ["Can you run this function", 1],
    ["Perform the lookup", 1],
    ["Find using tool", 1],
    ["Use the tool to find", 1],
    ["Could you run this process", 1],
    ["Run the process", 1],
    ["Use the tool", 1],
    
    // ---- false / casual chat ----
    ["What is my name", 0],
    ["Hello", 0],
    ["Hi", 0],
    ["How are you", 0],
    ["How is your day going", 0],
    ["Could you please tell me how your day is", 0],
    ["What is your name", 0],
    ["Please reword that", 0],
    ["Rewrite that", 0],
    ["Reword that", 0],
    ["Could you please reword that", 0],
    ["Could you please rephrase that", 0],
    ["Good morning", 0],
    ["Good night", 0],
    ["Nice to meet you", 0],
    ["How have you been", 0],
    ["Tell me a story", 0],
    ["What is the weather", 0],
    ["How do I cook pasta", 0],
    ["Can you explain this", 0],
    ["Do you know the time", 0],
    ["What day is it", 0],
    ["Tell me a joke", 0],
    ["Sing a song", 0],
    ["How do I solve this problem", 0],
    ["Give me advice", 0],
    ["Do you like music", 0],
    ["What is your favorite color", 0],
    ["How was your weekend", 0],
    ["Can you chat with me", 0],
    ["Do you know my name", 0],
    ["Can you help me", 0],
    ["Could you please help me", 0],
];
  

async function saveModel(model, path) {
    await model.save(tf.io.withSaveHandler(async (artifacts) => {
      fs.writeFileSync(path + "/toolmodel.json", JSON.stringify(artifacts.modelTopology));
      fs.writeFileSync(path + "/toolweights.json", JSON.stringify(artifacts.weightSpecs));
      fs.writeFileSync(path + "/toolweights.bin", new Uint8Array(artifacts.weightData));
      return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: "JSON" } };
    }));
}
  
async function loadModel(path) {
    const modelTopology = JSON.parse(fs.readFileSync(path + "/toolmodel.json"));
    const weightSpecs = JSON.parse(fs.readFileSync(path + "/toolweights.json"));
    const weightData = fs.readFileSync(path + "/toolweights.bin").buffer;
  
    // Convert Node.js buffer to Float32Array
    const weightArray = new Uint8Array(weightData).buffer;
  
    return await tf.loadLayersModel(tf.io.fromMemory({
      modelTopology,
      weightSpecs,
      weightData: weightArray
    }));
}

// ---- Simple tokenizer ----
const vocab = {};
let wordIndex = 1;
for (let [text] of trainingData) {
    for (let word of text.toLowerCase().split(/\s+/)) {
        if (!(word in vocab)) vocab[word] = wordIndex++;
    }
}

function textToTensor(text) {
    const tokens = text.toLowerCase().split(/\s+/).map(w => vocab[w] || 0);
    const MAXLEN = 6;
    const padded = new Array(MAXLEN).fill(0);
    for (let i = 0; i < Math.min(tokens.length, MAXLEN); i++) {
      // prevent out of bounds
      padded[i] = Math.min(tokens[i], Object.keys(vocab).length);
    }
    return tf.tensor2d([padded]);
}

async function trainModel() {
    const xs = [];
    const ys = [];
    for (let [text, label] of trainingData) {
        const t = textToTensor(text).arraySync()[0];
        xs.push(t);
        ys.push([label]);
    }

    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor2d(ys);

    const model = tf.sequential();
    model.add(tf.layers.embedding({ inputDim: wordIndex + 1, outputDim: 8, inputLength: 6 }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 8, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

    model.compile({
        optimizer: "adam",
        loss: "binaryCrossentropy",
        metrics: ["accuracy"],
    });

    console.log("Training model...");
    await model.fit(xsTensor, ysTensor, {
        epochs: 100,
        verbose: 0,
    });
    console.log("Model trained");

    // await model.save(MODEL_PATH);
    return model;
}

let model;


async function NeedsLLMTool(text) {
    if (!model) {
        // load model if it exists
        const hasPath = await fs.existsSync(MODEL_PATH + "/toolmodel.json");
        if (hasPath) {
            console.log("Loading tool model...");
            model = await loadModel(MODEL_PATH); // DOES NOT LOAD CORRECTLY
            console.log("Tool model loaded");
        } else {
            // otherwise train and save
            model = await trainModel();
            console.log("Saving model...");
            await saveModel(model, MODEL_PATH); // await to ensure saving completes
        }
    }

    const prediction = model.predict(textToTensor(text));
    const value = (await prediction.data())[0];
    return value > 0.5 ? 1 : 0;
}

module.exports = NeedsLLMTool;