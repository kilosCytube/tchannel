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
        description: "Limpa o seu historico de chat localmente.",
        run: (params, data) => {
            const buffer = document.querySelector("#messagebuffer");
            if (buffer) {
                buffer.innerHTML = "";
                sendLocalMessage("O chat foi limpo.");
            }
        }
    },

    // Comando: Dados / Roll
    roll: {
        description: "Rola um numero aleatorio. Uso: .roll <min> <max>",
        run: (params, data) => {
            const min = parseInt(params[0]) || 0;
            const max = parseInt(params[1]) || 100;
            
            if (min > max) {
                return sendLocalMessage("Erro: O minimo nao pode ser maior que o maximo.");
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
        description: "Lista todos os comandos disponiveis.",
        run: (params, data) => {
            sendLocalMessage("--- Comandos Disponiveis ---");
            Object.keys(commands).forEach(cmd => {
                sendLocalMessage(`${config.prefix}${cmd}: ${commands[cmd].description}`);
            });
        }
    },
    
    // Comando: Webm
    webm: {
        description: "Busca um webm aleatorio do 2ch.hk (Experimental).",
        run: async (params, data) => {
            if (!params[0]) return sendLocalMessage("Uso: .webm <url_da_thread>");
            if (window.CLIENT.name !== data.username) return;

            try {
                let threadUrl = params[0].replace(".html", ".json");
                const proxy = "https://cors-anywhere.herokuapp.com/"; 
                
                sendLocalMessage("Buscando videos...");
                
                const response = await fetch(proxy + threadUrl);
                const json = await response.json();
                
                const videos = [];
                json.threads[0].posts.forEach(post => {
                    if (post.files) {
                        post.files.forEach(file => {
                            if (file.type === 6 || file.type === 10) videos.push(file);
                        });
                    }
                });

                if (videos.length === 0) return sendLocalMessage("Nenhum video encontrado.");

                const randomVideo = videos[Math.floor(Math.random() * videos.length)];
                const videoUrl = "https://2ch.pm" + randomVideo.path;

                window.socket.emit("queue", {
                    id: videoUrl,
                    title: randomVideo.fullname,
                    pos: "end",
                    type: "fi",
                    temp: true
                });
                
                sendLocalMessage(`Adicionado: ${randomVideo.fullname}`);

            } catch (err) {
                console.error("[ChatCommands] Erro no webm:", err);
                sendLocalMessage("Erro ao buscar webm. Verifique o console (F12).");
            }
        }
    }
};

/** ---------------------------
 * Funções Auxiliares
 * -------------------------- */

// Envia uma mensagem cinza (local) apenas para você
function sendLocalMessage(msg) {
    if (typeof window.addChatMessage !== "function") {
        console.error("[ChatCommands] Erro: window.addChatMessage não existe!");
        return;
    }

    try {
        window.addChatMessage({
            username: "[Sistema]",
            meta: { addClass: "server-whisper", addClassToNameAndTimestamp: true },
            msg: msg,
            time: Date.now() // CORREÇÃO CRÍTICA: Número (Timestamp)
        });

        if (window.SCROLLCHAT) {
            window.scrollChat();
        }
    } catch (e) {
        console.error("[ChatCommands] Erro ao enviar mensagem local:", e);
    }
}

// Lida com a mensagem recebida do socket
function handleChatMsg(data) {
    if (!data.msg || !data.msg.startsWith(config.prefix)) return;

    // Limpeza básica
    const cleanMsg = data.msg.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const args = cleanMsg.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commands[commandName]) {
        commands[commandName].run(args, data);
    }
}

/** ---------------------------
 * Inicialização do Módulo
 * -------------------------- */
function init() {
    if (state.socket) return; 

    console.log("[ChatCommands] Inicializando...");
    state.socket = window.socket;
    state.username = window.CLIENT.name;

    state.socket.on("chatMsg", handleChatMsg);
    
    // Pequeno delay para garantir que o chat carregou antes de mandar a msg de boas vindas
    setTimeout(() => {
        sendLocalMessage(`Módulo de Comandos carregado. Use ${config.prefix}help`);
    }, 1000);
}

export default {
    init
};
