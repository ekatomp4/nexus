
// speechToText.js
let recognition;
let listening = false;

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;  // keep listening until stopped
    recognition.interimResults = true; // capture words before final
    recognition.lang = 'en-US';
}

const STT = {
    listen: (onResult) => {
        if (!recognition) {
            console.warn('SpeechRecognition not supported in this browser.');
            return;
        }

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const res = event.results[i];
              if (res.isFinal) {
                transcript += res[0].transcript;
              }
            }
          
            if (transcript && onResult) {
              onResult(transcript.trim(), event);
            }
        };
    },

    start: () => {
        if (!recognition || listening) return;
        recognition.start();
        listening = true;
    },

    stop: () => {
        if (!recognition || !listening) return;
        recognition.stop();
        listening = false;
    },

    restart: () => {
        STT.stop();
        setTimeout(() => STT.start(), 1000);
        console.log('STT restarted');
    },

    isActive: () => {
        return listening;
    }
};

export default STT;
