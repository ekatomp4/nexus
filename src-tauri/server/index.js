const express = require("express");
const robot = require("robotjs");


const cors = require("cors");
const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(cors());

// ai
// const { default: ollama } = require("ollama"); // CJS

const killPort = require("./backend/tools/killPort");
const chatSocket = require("./backend/socketAI");
const runCmd = require("./backend/tools/runCmd");


// tensors
const faceModel = require('./backend/tools/tensors/faceModel.js');


// main async
(async () => {
    // await killPort(3300);
    // await killPort(3301);

    // backend modules
    chatSocket.init();



    const PORT = process.env.PORT || 3300;

    app.get("/dashboard", (req, res) => {
        res.sendFile(__dirname + "/frontend/index.html");
    });

    app.get("/command", async (req, res) => {
        try {
            // decode and parse the array
            const args = JSON.parse(decodeURIComponent(req.query.args));
            console.log("\x1b[35m[CMD RUN]\x1b[0m", args);
            if (typeof args !== "object")
                throw new Error("Invalid args, expected array");
            const output = await runCmd(args);
            res.send(output);
        } catch (err) {
            res.status(500).send(err.toString());
        }
    });


    app.post('/getExpressions', async (req, res) => {
        try {
            console.log("Getting Expressions");
            const body = req.body;
        
            if (!body.image || typeof body.image !== 'string') {
                return res.status(400).send({ error: "Missing or invalid 'image' field" });
            }
        
            const dataURL = body.image;
        
            // call faceModel and await results
            const results = await faceModel.getExpression(dataURL);
        
            if (!results) {
                return res.status(200).send({ message: "No faces detected" });
            }
        
            // console.log("Expression results:", results);
        
            res.json(results); // send JSON back
        } catch (err) {
            console.error("Error in /getExpressions:", err);
            res.status(500).send({ error: err.toString() });
        }
    });     
    
    app.post('/movemouse', async (req, res) => {
        try {
            const body = req.body;

            // robot.moveMouseSmooth(body.mouse.x, body.mouse.y);
            robot.moveMouse(body.mouse.x, body.mouse.y);

            res.send(`Success: ${body.mouse.x + ' ' + body.mouse.y}`);
        } catch(err) {
            res.send(`Error: ${err}`);
        }
    });


    app.get("/", (req, res) => {
        res.send("Hello World!");
    });

    app.listen(PORT, () => {
        console.log(
            "Nexus Server Running, dashboard at http://localhost:3300/dashboard"
        );
    });


})();
// tensorflow test

// const imageModel = require('./backend/tools/tensors/imageModel.js');
// imageModel.getObjectsFromImgPath('media/testimage.jpg').then(predictions => console.log(predictions));


// test out tool use

const NeedsLLMTool = require('./backend/tools/tensors/NeedsLLMTool.js');
// Example usage
// (async () => {
//     const iterations = 1000;
//     const start = Date.now();
//     for (let i = 0; i < iterations; i++) {
//         await NeedsLLMTool("Could you please run lookup tool");
//         await NeedsLLMTool("How are you Nexus?");
//         await NeedsLLMTool("Can you lookup a blacket user named xotic");
//     }
//     console.log(`Took ${(Date.now() - start) / 1000} seconds to run ${iterations} iterations`);

//     console.log('Running TOOL LLM tests');
//     console.log(await NeedsLLMTool("Could you please run lookup tool"));
//     console.log(await NeedsLLMTool("How are you Nexus?"));
//     console.log(await NeedsLLMTool("Can you lookup a blacket user named xotic"));
// })();




// const TensorModel = require('./backend/tools/tensormodels/TextToBitModel.js');

// const myModel = new TensorModel("myModel", "./models/myModel");
// (async () => {
//     // await myModel.loadModel();
//     await myModel.train([["hello", 1], ["world", 0]], 50);
//     console.log(await myModel.predict("world"));
// })()


