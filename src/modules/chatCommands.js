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
            let min = parseInt(params[0]);
            let max = parseInt(params[1]);

            if (isNaN(min)) min = 0;
            if (isNaN(max)) max = 100;
            
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

    // NOVO: Comando Ask (Bola 8)
    ask: {
        description: "Responde sua pergunta com o destino. Uso: .ask <pergunta>",
        run: (params, data) => {
            if (params.length === 0) {
                return sendLocalMessage("Voce precisa fazer uma pergunta!");
            }

            const respostas = [
                "Com certeza.", "E decididamente assim.", "Sem duvida.", 
                "Sim, definitivamente.", "Voce pode contar com isso.", 
                "A meu ver, sim.", "Provavelmente.", "Parece bom.", 
                "Sim.", "Sinais apontam que sim.",
                "Resposta nebulosa, tente de novo.", "Pergunte mais tarde.", 
                "Melhor nao te dizer agora.", "Nao posso prever agora.", 
                "Concentre-se e pergunte novamente.",
                "Nao conte com isso.", "Minha resposta e nao.", 
                "Minhas fontes dizem nao.", "As perspectivas nao sao boas.", 
                "Muito duvidoso."
            ];

            const resposta = respostas[Math.floor(Math.random() * respostas.length)];

            if (window.CLIENT.name === data.username) {
                // Junta a pergunta de volta para mostrar contexto
                const pergunta = params.join(" "); 
                window.socket.emit("chatMsg", { msg: `/me 🎱 para "${pergunta}": ${resposta}` });
            }
        }
    },

    // NOVO: Comando Moeda
    moeda: {
        description: "Joga uma moeda (Cara ou Coroa).",
        run: (params, data) => {
            const lado = Math.random() > 0.5 ? "Cara" : "Coroa";
            
            if (window.CLIENT.name === data.username) {
                window.socket.emit("chatMsg", { msg: `/me jogou uma moeda e caiu: ${lado}` });
            }
        }
    },

    // Comando: Ajuda
    help: {
        description: "Lista todos os comandos disponiveis.",
        run: (params, data) => {
            let msg = "--- Comandos Disponiveis ---\n";
            Object.keys(commands).forEach(cmd => {
                msg += `${config.prefix}${cmd}: ${commands[cmd].description}\n`;
            });
            sendLocalMessage(msg);
        }
    }
};

/** ---------------------------
 * Funções Auxiliares
 * -------------------------- */

// Envia uma mensagem cinza (local) apenas para você
function sendLocalMessage(msg) {
    if (typeof window.addChatMessage !== "function") return;

    try {
        window.addChatMessage({
            username: "[server]",
            meta: { addClass: "server-whisper", addClassToNameAndTimestamp: true },
            msg: msg,
            time: new Date() + 5 
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

    const cleanMsg = data.msg.replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
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
    
    // Pequeno delay para garantir que o chat carregou
    setTimeout(() => {
        sendLocalMessage(`Modulo de Comandos carregado. Use ${config.prefix}help`);
    }, 1000);
}

export default {
    init
};
