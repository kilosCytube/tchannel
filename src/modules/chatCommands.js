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
    // Comando: Limpar
    clear: {
        description: "Limpa o historico de chat local.",
        run: (params, data) => {
            const buffer = document.querySelector("#messagebuffer");
            if (buffer) {
                buffer.innerHTML = "";
                sendLocalMessage("Chat limpo.");
            }
        }
    },

    // Comando: Dados / Roll
    roll: {
        description: "Rola dados. Uso: .roll <min> <max>",
        run: (params, data) => {
            let min = parseInt(params[0]);
            let max = parseInt(params[1]);

            if (isNaN(min)) min = 0;
            if (isNaN(max)) max = 100;
            
            if (min > max) {
                return sendLocalMessage("Erro: O minimo nao pode ser maior que o maximo.");
            }

            const result = Math.floor(Math.random() * (max - min + 1)) + min;
            
            // Mensagem pública via socket
            if (window.CLIENT.name === data.username) {
                window.socket.emit("chatMsg", { msg: `/me jogou os dados [${min}-${max}]: ${result}` });
            }
        }
    },

    // Comando: Ajuda
    help: {
        description: "Lista comandos.",
        run: (params, data) => {
            let msg = "--- Comandos Disponiveis ---\n"; // Usando \n em vez de <br>
            Object.keys(commands).forEach(cmd => {
                msg += `${config.prefix}${cmd}: ${commands[cmd].description}\n`;
            });
            sendLocalMessage(msg);
        }
    },
    
    // Comando: Webm
    webm: {
        description: "Busca video no 2ch.hk (Experimental)",
        run: async (params, data) => {
            if (!params[0]) return sendLocalMessage("Uso: .webm <url_da_thread>");
            if (window.CLIENT.name !== data.username) return;

            try {
                let threadUrl = params[0].replace(".html", ".json");
                // Proxy necessário. Se falhar, visite o site do cors-anywhere para renovar acesso.
                const proxy = "https://cors-anywhere.herokuapp.com/"; 
                
                sendLocalMessage("Buscando videos...");
                
                const response = await fetch(proxy + threadUrl);
                const json = await response.json();
                
                const videos = [];
                // Filtra arquivos do tipo 6 (webm) e 10 (mp4)
                if (json.threads && json.threads[0] && json.threads[0].posts) {
                    json.threads[0].posts.forEach(post => {
                        if (post.files) {
                            post.files.forEach(file => {
                                if (file.type === 6 || file.type === 10) videos.push(file);
                            });
                        }
                    });
                }

                if (videos.length === 0) return sendLocalMessage("Nenhum video encontrado nesta thread.");

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
                console.error("[ChatCommands] Erro:", err);
                sendLocalMessage("Erro ao buscar. Verifique o Console (F12) para detalhes.");
            }
        }
    }
};

/** ---------------------------
 * Funções Auxiliares
 * -------------------------- */

// Envia mensagem local (cinza) imitando a biblioteca original
function sendLocalMessage(msg) {
    if (typeof window.addChatMessage !== "function") return;

    try {
        // Formato exato do Simple-Cytube-Commands
        window.addChatMessage({
            username: "[server]", 
            meta: { 
                addClass: "server-whisper", 
                addClassToNameAndTimestamp: true 
            },
            msg: msg,
            time: new Date() + 5 // Truque de timestamp original
        });

        if (window.SCROLLCHAT) {
            window.scrollChat();
        }
    } catch (e) {
        console.error("[ChatCommands] Erro no sendLocalMessage:", e);
    }
}

// Handler de mensagens do socket
function handleChatMsg(data) {
    // Validações básicas
    if (!data || !data.msg || typeof data.msg !== 'string') return;
    if (!data.msg.startsWith(config.prefix)) return;

    // Remove HTML entities básicos que o CyTube pode ter adicionado
    const cleanMsg = data.msg
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();

    const args = cleanMsg.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commands[commandName]) {
        commands[commandName].run(args, data);
    }
}

/** ---------------------------
 * Inicialização
 * -------------------------- */
function init() {
    if (state.socket) return; // Evita dupla inicialização

    console.log("[ChatCommands] Carregando modulo...");
    state.socket = window.socket;
    state.username = window.CLIENT.name;

    // Remove listener anterior se houver (para evitar duplicidade ao recarregar script)
    if (state.socket.hasListeners("chatMsg")) {
       // Nota: removeListener é arriscado se remover listeners do CyTube, 
       // mas como nossa função é específica, o ideal é apenas adicionar.
    }

    state.socket.on("chatMsg", handleChatMsg);
    
    // Teste de carga
    console.log("[ChatCommands] Modulo pronto.");
    setTimeout(() => sendLocalMessage(`Comandos carregados. Digite ${config.prefix}help`), 1000);
}

export default {
    init
};
