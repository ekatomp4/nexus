const { default: ollama } = require('ollama');
const runCmd = require('../tools/runCmd');
const fs = require('fs');
const sharp = require('sharp');
const os = require('os');

const getWiki = require('./modelTools/getWiki');
(async () => {
    const returnData = await getWiki('Trenbolone acetate');
    console.log(returnData);
})();


const NeedsLLMTool = require('../tools/tensors/NeedsLLMTool');
// load model 
NeedsLLMTool("Can you please run your lookup tool");

// const getWiki = require('./modelTools/getWiki');

const modelList = {
    'llama': 'llama3.1:8b',

    'medium': 'qwen3:4b-instruct-2507-q4_K_M',
    'quick': 'phi3:3.8b-mini-4k-instruct-q4_K_S',
    'fast': 'qwen3:1.7b-q4_K_M',
    'ultrafast': 'gemma3:1b', // follows directions very well
    'hyperfast': 'gemma3:270m',

    // qwen3:4b-instruct-2507-q4_K_M

    'image_l': 'llava:7b',
    'image_m': 'granite3.2-vision:2b',
    'image_s': 'moondream:1.8b-v2-q3_K_S',


    // required
    'normal': 'granite3.3:2b', // best so far for responses and code and speed
    // 'normal': 'qwen3:4b-instruct-2507-q4_K_M',
    'code': 'qwen2.5-coder:3b', // slightly slower and alWays uses tools
    'image': 'granite3.2-vision:2b', // slow but functional

}

class ChatBotV1 {
    constructor(modelName = 'normal', socket = null) {

        this.modelName = modelName;
        this.defaultModel = modelList[modelName] || modelList['gwen'];

        // params
        /*phi3:3.8b-mini-4k-instruct-q4_K_S

        y8!XPVq2K7KJrFA1*

        // make global
        setx OLLAMA_FLASH_ATTENTION "true"
        setx OLLAMA_KV_TYPE "f16"

        echo %OLLAMA_FLASH_ATTENTION%
        echo %OLLAMA_KV_TYPE%
        */

        // TODO ability to commit to memory, change memory and remove memory

        this.memory = [];


        this.tools = {
            // MUST BE ALL LOWERCASE
            'lookup': {
                'description': 'find information about a topic',
                'parameters': {
                    'topic': 'string'
                },
                'example': '/lookup(topic)',
                'function': async (topic) => {
                    console.log("looking up", topic);
                    return await getWiki(topic);
                }
            },
            'runcmd': {
                'description': 'run a command in the terminal',
                'parameters': {
                    'command': 'string'
                },
                'example': '/runcmd(start calc.exe)',
                'function': async (command) => {
                    // replace / at start if there is one
                    if (command.startsWith('/')) {
                        command = command.slice(1);
                    }

                    console.log("running command", command);
                    return await runCmd([command]);
                }
            },
            'creatememory': {
                'description': 'memorize something important',
                'parameters': {
                    'name': 'string',
                    'value': 'string'
                },
                'example': '/creatememory(memory)',
                'function': async (vals) => {
                    console.log("creating memory", vals);
                    this.memory.push(vals)

                }
            },
            'blacketuser': {
                'description': 'get information from blacket about a user',
                'parameters': {
                    'username': 'string'
                },
                'function': async (username) => {
                    console.log("getting blacket user", username);
                    const response = await fetch(`https://blacket.org/worker2/user-no-auth-required/${username}`)
                        .then(res => res.json())
                        .catch(err => { console.log(err); return null; });
                    // console.log(response);
                    if (response && response.user) {
                        // return JSON.stringify(response);
                        return `
                        Username: ${response.user.username}
                        ID: ${response.user.id}
                        Amount of Blooks: ${Object.keys(response.user.blooks).length}
                        Badges: ${response.user.badges.join(', ')}
                        Role: ${response.user.role}
                        Packs Opened: ${response.user.misc.opened}
                        Messages Sent: ${response.user.misc.messages}
                        `
                    } else {
                        return `User ${username} not found.`;
                    }
                }
            }
        }

        // set params
        runCmd([
            'setx OLLAMA_FLASH_ATTENTION "true"',
            'setx OLLAMA_KV_TYPE "f16"',
            'setx OLLAMA_USE_CUDA "true"'
        ]);
        process.env.OLLAMA_USE_CUDA = 'true';
        process.env.OLLAMA_FLASH_ATTENTION = 'true';
        process.env.OLLAMA_KV_TYPE = 'f16';
        // show params
        runCmd([
            'echo %OLLAMA_FLASH_ATTENTION%',
            'echo %OLLAMA_KV_TYPE%',
            'echo %OLLAMA_USE_CUDA%'
        ]);

        // setup
        this.socket = socket;
        this.onMessage = null;
        this.history = [
            { role: 'user', content: `Welcome Nexus, it is ${new Date().toLocaleString()}` },
            { role: 'assistant', content: 'Hello, how can I help you?' },
            { role: 'user', content: 'can you open my terminal please' },
            { role: 'assistant', content: '/runcmd(start cmd.exe)' },
        ]; // <-- store the conversation
        this.parameters = {
            maxHistory: 10,
            // tokens and temperature
        }


        this.options = {
            temperature: 0.4,
            repititionPenalty: 1.3,
        },



        // this.preload();

        // system

        this.specs = {
            'OS': process.platform,
            'CPU': os.cpus()[0].model,
            'RAM': os.totalmem() / 1024 / 1024,
        }

        // tools
        this.systemPrompts = [
            `Your name is Nexus (model ${this.modelName}), try to respond in under a sentence, 
            follow commands strictly. Don't use any onomonopia or actions, do not repeat yourself`,

            `Machine specs: ${JSON.stringify(this.specs)}`,

            // `If you are asked about something you don't know, always call the tool "lookup" with
            //  the topic name as a JSON object. Do not answer from memory if you are unsure, instead,
            //   call the tool and include the result in your reply. 
            //   Example:  "tool_calls": [{"name": "lookup","arguments": { "topic": "<topic_name>" }}]`
        ];
        this.temporarySystemPrompts = [];

    }

    createSystemPrompt(prompt) {
        this.systemPrompts.push(prompt);
    }

    preload() {
        (async () => {
            await ollama.chat({
                model: modelList['fast'],
                messages: [{ role: 'user', content: 'Hello' }],
                stream: false,
            });
        })();
    }

    setOnMessage(callback) {
        this.onMessage = callback;
    }

    setModel(modelName) {
        this.defaultModel = modelName;
    }

    clampHistoryLength() {
        if (this.history.length > this.parameters.maxHistory) {
            // don't remove system prompts
            while (this.history.length > this.parameters.maxHistory && this.history[0].role !== 'system') {
                this.history.shift();
            }
        }
    }

    async run(text, forceModel = null) {
        this.temporarySystemPrompts = [];

        // find optimal model
        let chosenModel = this.defaultModel;
        let codeWords = ['code', 'script', 'cmd', 'terminal', 'console'];
        if (codeWords.some(word => text.includes(word)) && modelList['code']) {
            chosenModel = modelList['code'];
        }
        let isImageModel = false;
        let imageWords = ['image', 'photo', 'picture', 'img'];
        if (imageWords.some(word => text.includes(word)) && modelList['image']) {
            chosenModel = modelList['image'];
            isImageModel = true;
        }

        if (forceModel) {
            chosenModel = modelList[forceModel];
        }


        // add temporary system prompts

        console.log(`[ChatBotV1] Deciding tools`);
        const needsTool = await NeedsLLMTool(text);
        console.log(`[ChatBotV1] Needs tool: ${needsTool === 1 ? 'yes' : 'no'}`);
        if (needsTool === 1) {
            // format

            const formattedTools = {};
            for (const toolName in this.tools) {
                const tool = this.tools[toolName];
                formattedTools[toolName] = {
                    description: tool.description,
                    parameters: tool.parameters,
                    example: tool.example
                };
            }
            // add
            this.temporarySystemPrompts.push(`
                Your tools are: ${JSON.stringify(formattedTools)}, you must run a tool, 
                it should say /name(arguments...), with each argument seperated by a comma
            `);
        } else if (needsTool === 0) {
            // this.temporarySystemPrompts.push("You must not use a tool!");
        }

        // init history
        const history = [];

        for(const prompt of this.systemPrompts) {
            history.push({ role: 'system', content: prompt });
        }
        history.push({ role: 'assistant', content: `Memory: ${JSON.stringify(this.memory)}` });
        for(const prompt of this.temporarySystemPrompts) {
            history.push({ role: 'system', content: prompt.replace(/\\n/g, '').trim() });
        }
        for(const message of this.history) {
            history.push({ role: message.role, content: message.content });
        }

        // run

        if (!chosenModel) throw new Error('No model selected');
        console.log(`[ChatBotV1] Running prompt on model: ${chosenModel}`);

        const formattedText = `${text}`;

        // Images to be included in the message, either as Uint8Array or base64 encoded strings.
        const images = ['testimage.jpg'];
        const formattedImages = await Promise.all(
            images.map(async (image) => {
                const imageData = await sharp('media/' + image)
                    .resize(200, 200, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .png()
                    .toBuffer();
                return imageData;
            })
        );

        // Add the latest user message to history
        this.history.push({
            role: 'user',
            content: formattedText,
            images: isImageModel ? formattedImages : undefined
        });

        history.push({
            role: 'user',
            content: formattedText,
            images: isImageModel ? formattedImages : undefined
        });
        

        if (this.history.length > this.parameters.maxHistory) {
            this.clampHistoryLength();
        }

        // console.log(history);

        // Stream with full conversation history
        const response = await ollama.chat({
            model: chosenModel,
            messages: history,
            options: this.options,
            stream: true,
            keep_alive: "10m",
            think: false,
        });

        let finalText = '';

        let privateMode = false;
        let isThinking = false;
        let privateText = '';
        let publicText = '';

        for await (const part of response) {

            if (part.message?.tool_calls) {

                const toolList = part.message?.tool_calls;
                const func = part.message?.tool_calls[0].function;


                const name = func.name;
                const args = func.arguments;

                console.log(name, args);
                console.log(toolList);
                // if(name=='getWiki') {
                //     console.log('getting Wiki');
                //     const topic = part.message?.tool_calls[0].arguments.topic;
                //     const wiki = await getWiki(topic);
                //     console.log(wiki);
                //     finalText += wiki;
                // }

            } else if (part.message?.content) {

                let chunk = part.message?.content || '';
                const trimmedChunk = chunk.trim();
                console.log(chunk)

                if (trimmedChunk == '[[' && !isThinking) {
                    privateMode = true;
                    console.log('Private mode ON')
                }

                finalText += chunk;

                if (trimmedChunk === "<think>") {
                    isThinking = true;
                }

                if (trimmedChunk === '</think>') {
                    isThinking = false;
                }
                // console.log(chunk);

                if (trimmedChunk == "\n") {
                    chunk = '<br>';
                }

                if (privateMode) {
                    privateText += chunk;
                } else if (!isThinking) {
                    publicText += chunk;
                    if (this.onMessage) this.onMessage(chunk);
                    if (this.socket) this.socket.broadcast(chunk);
                }

                if (chunk.trim() == ']]' && privateMode) {
                    privateMode = false;
                    console.log('Private mode OFF')
                }

            }



        }

        // TODO performance metrics

        console.log(finalText);


        // Save the assistant's reply to history (once)
        this.history.push({ role: 'assistant', content: finalText });

        // run tools
        const splitText = finalText.split('/');
        for (const tool of splitText) {
            const toolName = tool.split('(')[0].toLowerCase();
            if (this.tools[toolName]) {
                const toolArgs = tool.split('(')[1].split(')')[0];
                if (!toolArgs) continue;
                console.log("[TOOL RUN]", toolName, toolArgs);

                try {
                    const returnValue = await this.tools[toolName].function(toolArgs);
                    // put back into
                    console.log("[TOOL RETURN]", returnValue);
                    if (returnValue) {
                        this.run(`Tool: "${toolName}" returned: ${returnValue}, talk about it`, 'normal');
                    }
                } catch (err) {
                    this.run(`[TOOL ERROR] ${toolName}: ${err}`);
                }

            }
        }

        return finalText;
    }


    // optional: reset conversation
    reset() {
        this.history = [];
    }
}

module.exports = ChatBotV1;
