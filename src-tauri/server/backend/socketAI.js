const { WebSocketServer } = require('ws');
const ChatBot = require('./models/ChatBotV1');

const chatBot = new ChatBot();

class SocketAI {
    constructor(port = 3301) {
        this.wss = new WebSocketServer({ port, path: '/chat' });

        this.wss.on('connection', (ws) => {
            console.log('Client connected');

            chatBot.setOnMessage(chunk => {
                // Stream each chunk to this specific client
                if (ws.readyState === ws.OPEN) ws.send(chunk);
            });

            ws.on('message', async (message) => {
                console.log('Received message:', message.toString());

                // Run the chatbot and stream to this client
                try {
                    await chatBot.run(message.toString());
                } catch (err) {
                    console.error('ChatBot error:', err);
                    if (ws.readyState === ws.OPEN) ws.send('[ERROR] AI failed to respond.');
                }
            });

            ws.on('close', () => console.log('Client disconnected'));
        });
    }

    init() {
        console.log(`✅ WebSocket server started on ws://localhost:${this.wss.options.port}/chat`);
    }
}

module.exports = new SocketAI();