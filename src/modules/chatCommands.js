// src/modules/chatCommands.js

const config = {
    prefix: ".", // Prefixo do comando
};

const state = {
    socket: null,
    username: null,
};

/** ---------------------------
 * Definição dos Comandos
 * -------------------------- */
const commands = {
    // Comando: Limpar Chat Local
    clear: {
        description: "Limpa o seu histórico de chat localmente.",
        run: (params, data) => {
            document.querySelector("#messagebuffer").innerHTML = "";
            sendLocalMessage("O chat foi limpo.");
        }
    },

    // Comando: Dados / Roll
    roll: {
        description: "Rola um número aleatório. Uso: .roll <min> <max>",
        run: (params, data) => {
            const min = parseInt(params[0]) || 0;
            const max = parseInt(params[1]) || 100;
            
            if (min > max) {
                return sendLocalMessage("Erro: O mínimo não pode ser maior que o máximo.");
            }

            const result = Math.floor(Math.random() * (max - min + 1)) + min;
            
            // Envia para todos verem usando /me
            if (window.CLIENT.name === data.username) {
                window.socket.emit("chatMsg", { msg: `/me jogou os dados [${min}-${max}]: ${result}` });
            }
        }
    },

    // Comando: Ajuda
    help: {
        description: "Lista todos os comandos disponíveis.",
        run: (params, data) => {
            let msg = "<strong>Comandos Disponíveis:</strong><br>";
            Object.keys(commands).forEach(cmd => {
                msg += `<code>${config.prefix}${cmd}</code>: ${commands[cmd].description}<br>`;
            });
            sendLocalMessage(msg);
        }
    },
    
    // Comando: Webm (Adaptado do repo original)
    // Nota: Requer proxy CORS e API do 2ch.hk, pode ser instável.
    webm: {
        description: "Busca um webm aleatório de uma thread do 2ch.hk (Experimental).",
        run: async (params, data) => {
            if (!params[0]) return sendLocalMessage("Uso: .webm <url_da_thread>");
            
            // Apenas o próprio usuário executa a busca para não floodar
            if (window.CLIENT.name !== data.username) return;

            try {
                // Truque para pegar o JSON da thread
                let threadUrl = params[0].replace(".html", ".json");
                // Proxy CORS necessário para browsers modernos
                const proxy = "https://cors-anywhere.herokuapp.com/"; 
                
                sendLocalMessage("Buscando vídeos na thread...");
                
                const response = await fetch(proxy + threadUrl);
                const json = await response.json();
                
                const videos = [];
                // Varre os posts procurando arquivos mp4 ou webm (tipos 6 e 10 no 2ch)
                json.threads[0].posts.forEach(post => {
                    if (post.files) {
                        post.files.forEach(file => {
                            if (file.type === 6 || file.type === 10) videos.push(file);
                        });
                    }
                });

                if (videos.length === 0) return sendLocalMessage("Nenhum vídeo encontrado.");

                const randomVideo = videos[Math.floor(Math.random() * videos.length)];
                const videoUrl = "https://2ch.pm" + randomVideo.path;

                // Adiciona à playlist
                window.socket.emit("queue", {
                    id: videoUrl,
                    title: randomVideo.fullname,
                    pos: "end",
                    type: "fi", // File Import
                    temp: true
                });
                
                sendLocalMessage(`Vídeo encontrado e adicionado: ${randomVideo.fullname}`);

            } catch (err) {
                console.error(err);
                sendLocalMessage("Erro ao buscar webm. Verifique o console (pode ser erro de CORS).");
            }
        }
    }
};

/** ---------------------------
 * Funções Auxiliares
 * -------------------------- */

// Envia uma mensagem cinza (local) apenas para você
function sendLocalMessage(msg) {
    window.addChatMessage({
        username: "[Sistema]",
        meta: { addClass: "server-whisper", addClassToNameAndTimestamp: true },
        msg: msg,
        time: new Date()
    });
}

// Lida com a mensagem recebida do socket
function handleChatMsg(data) {
    // Ignora se não tiver mensagem ou não começar com o prefixo
    if (!data.msg || !data.msg.startsWith(config.prefix)) return;

    // Limpa HTML entities básicos para evitar problemas no parsing
    const cleanMsg = data.msg.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    
    const args = cleanMsg.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commands[commandName]) {
        // Executa o comando
        commands[commandName].run(args, data);
    }
}

/** ---------------------------
 * Inicialização do Módulo
 * -------------------------- */
function init() {
    if (state.socket) return; // Já inicializado

    console.log("[ChatCommands] Inicializando...");
    state.socket = window.socket;
    state.username = window.CLIENT.name;

    // Ouve todas as mensagens do chat
    state.socket.on("chatMsg", handleChatMsg);
    
    sendLocalMessage(`Módulo de Comandos carregado. Digite <code>${config.prefix}help</code> para ver.`);
}

export default {
    init
};
