const { invoke } = window.__TAURI__.core;

async function sendCommand(args) {
  // serialize array into a JSON string and encode it
  const encodedArgs = encodeURIComponent(JSON.stringify(args));
  return fetch(`http://localhost:3300/command?args=${encodedArgs}`)
    .then(response => response.text());
}

// sendCommand(['start calc.exe']);

// SPEECH

import TTS from '/modules/speech/TTS.js';
import STT from '/modules/speech/STT.js';

const chatOutput = document.getElementById('chatOutput');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('chatSend');

const ws = new WebSocket('ws://localhost:3301/chat');

let currentWord = '';
let listening = false;
let speaking = false;

const listeningPeriod = 15000;
const speakingTimeout = 2000;

const sendTimeout = 2000;

const waitWordTimeout = 2000;
const waitWordCharacterLength = 20;
const waitingWords = [
  'let me think',
  'let me see',
  'let me look',
  'give me a second',
  'one moment',
  'one second',
  'just a moment',
  'just a second',
  'just a moment'
]
let canRespond = false;


let lastSend = null;
function sendToAI(message) {

  if(lastSend) {
    if(Date.now() - lastSend < sendTimeout) {
      console.log('Throttling');
      return;
    }
  }
  lastSend=Date.now();


  chatOutput.innerHTML += `<p><b>You: </b>${message}</p><b>Nexus: </b>`;
  chatInput.innerHTML = '';


  if (listening) {
    console.log('Sending:', message);

    ws.send(message);
    speaking = false;
    listening = false;

    function startWaiting() {
      setTimeout(() => {
        if (!speaking && !listening && !canRespond && message.length > waitWordCharacterLength) {
          const waitingWord = waitingWords[Math.floor(Math.random() * waitingWords.length)];
          TTS.send(waitingWord, { rate: 0.8 });
        }
      }, waitWordTimeout);
    }

    startWaiting();

  }
}

ws.onopen = () => console.log('Connected to AI WebSocket');


ws.onmessage = (event) => {
  // get word
  currentWord += event.data;
  speaking = true;
  if (STT.isActive()) STT.stop();

  const endCharacters = ['.', '?', '!', ',', ';', ':'];
  if (endCharacters.includes(event.data)) {

    TTS.send(currentWord).then(async () => {
      // Wait until speechSynthesis has fully finished
      while (speechSynthesis.speaking) {
        console.log('Waiting for TTS to finish...');
        await new Promise(r => setTimeout(r, 100));
      }

      // Optional short delay before listening
      await new Promise(r => setTimeout(r, speakingTimeout));

      speaking = false;
      listening = true;
      canRespond = true;

      if (!STT.isActive()) STT.start();
      console.log('TTS finished, listening period started');

      // stop listening after `listeningPeriod`
      await new Promise(r => setTimeout(r, listeningPeriod));
      listening = false;
      canRespond = false;
      STT.start();
      console.log('Listening period ended');
    });

    currentWord = '';
  }


  // send data
  chatOutput.innerHTML += `${event.data}`;
  chatOutput.scrollTop = chatOutput.scrollHeight; // auto-scroll
};

ws.onerror = (err) => console.error('WebSocket error:', err);

ws.onclose = () => console.log('WebSocket disconnected');

sendButton.addEventListener('click', () => {
  const message = chatInput.innerText;
  if (message.trim() === '') return;

  listening = true;
  sendToAI(message);
  chatInput.innerText = '';
});

// speech to text


STT.start();

window.sttStart = () => STT.start();
window.sttStop = () => STT.stop();
window.sttRestart = () => STT.restart();

window.addEventListener('focus', () => {
  console.log('Focus');
  STT.stop();
  setTimeout(() => STT.start(), 1000);
});
window.addEventListener('blur', () => {
  console.log('Blur');
})
document.getElementById('restartSTT').addEventListener('click', () => STT.restart());

STT.listen((text, event) => {

  if (speaking) {
    console.log('Ignoring:', text);
    return;
  }

  console.log('Hearing:', text);
  const cleanedText = text.replace(/\./g, '').toLowerCase();

  // normal command
  if (listening && !speaking) {
    sendToAI(text);
  }

  const aliases = [
    'nexus',
    'machine',
    'computer',
    'jarvis',
    'garmin'
  ]

  // hey [[alias]], [[command]]
  if (aliases.some(alias => text.toLowerCase().startsWith(`hey ${alias}`))) {
    listening = true;
    sendToAI(text);
    return;
  }

  // [[alias]], [[command]]
  if (aliases.some(alias => text.toLowerCase().includes(`${alias}`))) {
    console.log('Responding to:', text);
    listening = true;
    sendToAI(text);
    return;
  }


  // function [[function]]
  if (text.toLowerCase().startsWith('function')) {
    const newText = text.toLowerCase().replace('function', '').trim();
    console.log('Function:', newText);
    listening = true;
    sendToAI(newText);
    return;
  }



});


//CAMERA


import Camera from "./modules/camera/Camera.js";

const video = document.getElementById("cam");
const canvas = document.getElementById("camOverlay");
const camera = new Camera(video, canvas);
camera.start();



import HandOverlay from "./modules/camera/HandOverlay.js";
HandOverlay.init(camera);

// set canvas resolution to match container size
function resizeCanvases() {
  const { clientWidth, clientHeight } = document.getElementById("camContainer");
  canvas.width = clientWidth;
  canvas.height = clientHeight;

  positionOverlay.width = window.innerWidth;
  positionOverlay.height = window.innerHeight;
}

resizeCanvases(); // call once at startup
window.addEventListener("resize", resizeCanvases);



// TESTING GAN


// import GAN from "./modules/GAN/GAN.js";
// // --- Prepare training data ---
// const trainingData = [
//   { input: "Black", canvas: document.createElement("canvas") },
//   { input: "Grey", canvas: document.createElement("canvas") },
//   { input: "White", canvas: document.createElement("canvas") },
// ];

// // Fill training canvases

// trainingData.forEach((data) => {
//   const { canvas, input } = data;
//   canvas.width = 64;
//   canvas.height = 64;
//   const ctx = canvas.getContext("2d");

//   switch (input.toLowerCase()) {
//     case "black":
//       ctx.fillStyle = "#000000";
//       break;
//     case "grey":
//       ctx.fillStyle = "#808080";
//       break;
//     case "white":
//       ctx.fillStyle = "#FFFFFF";
//       break;
//     default:
//       ctx.fillStyle = "#FF00FF"; // fallback
//   }

//   ctx.fillRect(0, 0, canvas.width, canvas.height);
// });

// // --- Initialize GAN ---
// GAN.init?.(); // optional, if you have an init function

// // --- Start training ---
// // The GAN will use the trainingData and draw outputs on a top-left red canvas
// GAN.train(trainingData);


async function fetchAndDrawImage(prompt, width = 512, height = 512, seed = Date.now()) {
  // Build URL
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  // Load image
  const img = new Image();
  img.crossOrigin = "anonymous"; // allow canvas access
  img.src = url;

  return new Promise((resolve, reject) => {
      img.onload = () => {
          // Create canvas
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.style.position = "absolute";
          canvas.style.top = "0px";
          canvas.style.left = "0px";
          document.body.appendChild(canvas);

          // Draw image
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas);
      };

      img.onerror = reject;
  });
}

TTS.send("Welcome back Sir! How may I assist you?");

// fetchAndDrawImage("Hello").then((canvas) => {
//   console.log(canvas);
// });

// async function AIVoice(text, voice = "alloy") {
//   const formattedText = `Say this, repeat exactly: "${text}"`; // wrap in quotes
//   const url = `https://text.pollinations.ai/${encodeURIComponent( formattedText )}?model=openai-audio&voice=${voice}`;

//   try {
//     const res = await fetch(url, {
//       headers: { "Accept": "audio/mpeg" }
//     });

//     if (!res.ok) {
//       console.error("AIVoice fetch failed:", res.status, res.statusText);
//       return;
//     }

//     const blob = await res.blob();
//     const audioUrl = URL.createObjectURL(blob);

//     const audio = new Audio(audioUrl);
//     audio.play();

//     return audio;
//   } catch (err) {
//     console.error("AIVoice error:", err);
//   }
// }

// // Example:
// AIVoice("What is a dolphin?", "nova");


/*
## Pollinations.AI Cheatsheet for Coding Assistants

### Image Generation
Generate Image: `GET https://image.pollinations.ai/prompt/{prompt}`

### Image Models
List Models: `GET https://image.pollinations.ai/models`

### Text Generation
Generate (GET): `GET https://text.pollinations.ai/{prompt}`

### Text Generation (Advanced)
Generate (POST): `POST https://text.pollinations.ai/`

### Audio Generation
Generate Audio: `GET https://text.pollinations.ai/{prompt}?model=openai-audio&voice={voice}`

### OpenAI Compatible Endpoint
OpenAI Compatible: `POST https://text.pollinations.ai/openai`        

### Text Models              
List Models: `GET https://text.pollinations.ai/models` 
### Real-time Feeds
Image Feed: `GET https://image.pollinations.ai/feed`
Text Feed: `GET https://text.pollinations.ai/feed`
*\* required parameter*
*/


import tabHandler from './modules/tabHandler.js';
