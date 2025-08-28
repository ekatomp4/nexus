let ttsQueue = [];
let speaking = false;
let queuePromise = null;
let queueResolve = null;

const synth = window.speechSynthesis;

/**
 * Speak a single text string and return a promise
 */
function speakText(data) {
    const {text, options} = data;
    return new Promise((resolve, reject) => {
        if (!text) return resolve();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';

        // Default values
        utterance.rate = 1.2;
        utterance.pitch = 1.7;
        utterance.volume = 1;

        // Exaggerate for questions
        if (text.endsWith('?')) {
            utterance.rate = 1.5;    // faster for questioning tone
            utterance.pitch = 2.0;   // higher pitch to emphasize curiosity
        }

        // Exaggerate for exclamations
        if (text.endsWith('!')) {
            utterance.rate = 1.6;    // faster for excitement
            utterance.pitch = 2.1;   // higher pitch for emphasis
            // volume stays at 1 (max), exaggeration through pitch and rate
        }

        // Optional: tiny random variation for realism
        utterance.rate += (Math.random() - 0.5) * 0.05;   // ±0.025
        utterance.pitch += (Math.random() - 0.5) * 0.05;  // ±0.025


        // force
        if(options) {
            Object.keys(options).forEach(key => utterance[key] = options[key]);
        }

        utterance.onend = () => resolve();
        utterance.onerror = (err) => reject(err);

        speechSynthesis.speak(utterance);
    });
}

/**
 * Process queued utterances sequentially
 */
async function processQueue() {
    if (speaking) return; // already running

    speaking = true;
    try {
        while (ttsQueue.length > 0) {
            const next = ttsQueue.shift();
            await speakText(next); // wait until spoken
        }
        // wait until the browser actually finishes speaking
        while (speechSynthesis.speaking) {
            await new Promise(r => setTimeout(r, 100));
        }
    } finally {
        speaking = false;
        if (queueResolve) {
            queueResolve();   // resolve the promise once queue is fully spoken
            queueResolve = null;
            queuePromise = null;
        }
    }
}

/**
 * Add text to the TTS queue
 * Returns a promise that resolves when the queue is fully processed
 */
function Send(text, options) {
    if (!text) return Promise.resolve();

    ttsQueue.push({text, options});
    if (!queuePromise) {
        queuePromise = new Promise((resolve) => {
            queueResolve = resolve;
        });
    }

    processQueue();
    return queuePromise;
}

const TTS = {
    send: Send,
    isActive: () => {
        // Only return false when queue is empty AND speechSynthesis is done speaking
        return ttsQueue.length > 0 || speaking || speechSynthesis.speaking;
    }
}

export default TTS;

// change

let voices = [];

function populateVoiceList() {
    console.log('Populating voice list');
    voices = synth.getVoices();
    // You can then use this 'voices' array to select a specific voice
    // For example, to log available voices:
    // console.log(voices);
}

voices = speechSynthesis.getVoices();
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = populateVoiceList;
}
console.log(voices);