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

    // Comando: Dados / Roll (Híbrido: RPG e Simples)
    roll: {
        description: "Rola dados. Uso: .roll 1d20+5 OU .roll <min> <max>",
        run: (params, data) => {
            const fullText = params.join("").toLowerCase();

            // MODO 1: Notação de RPG (se tiver 'd' no texto, ex: 1d20)
            if (fullText.includes("d")) {
                let total = 0;
                let outputLog = [];
                let error = false;

                // Regex para capturar grupos: (Sinal)(Qtd)d(Faces) OU (Sinal)(Numero)
                // Ex: 1d20, +5, -1d4
                const regex = /([+-]?)(\d+)d(\d+)|([+-]?)(\d+)/g;
                let match;

                while ((match = regex.exec(fullText)) !== null) {
                    if (match[0] === "") continue;

                    // CASO A: É um dado (ex: 1d20) - match[3] é as faces
                    if (match[3]) {
                        const sign = match[1] === "-" ? -1 : 1;
                        const count = parseInt(match[2]); // Qtd de dados
                        const faces = parseInt(match[3]); // Lados

                        if (count > 50) return sendLocalMessage("Erro: Muitos dados (max 50).");
                        if (faces > 1000) return sendLocalMessage("Erro: Lados demais (max 1000).");

                        let subTotal = 0;
                        let rolls = [];

                        for (let i = 0; i < count; i++) {
                            const val = Math.floor(Math.random() * faces) + 1;
                            subTotal += val;
                            rolls.push(val);
                        }

                        total += (subTotal * sign);
                        
                        // Formatação: +2d6([3,5])
                        const signStr = sign === -1 ? "-" : "+";
                        outputLog.push(`${signStr}${count}d${faces}([${rolls.join(",")}])`);
                    } 
                    // CASO B: É um modificador fixo (ex: +5) - match[5] é o valor
                    else if (match[5]) {
                        const sign = match[4] === "-" ? -1 : 1;
                        const val = parseInt(match[5]);
                        total += (val * sign);
                        outputLog.push(`${sign === -1 ? "-" : "+"}${val}`);
                    }
                }

                // Monta a string final
                let msgResult = outputLog.join(" ");
                if (msgResult.startsWith("+")) msgResult = msgResult.substring(1); // Remove o + do inicio

                if (window.CLIENT.name === data.username) {
                    window.socket.emit("chatMsg", { 
                        msg: `/me rolou: ${msgResult} = **${total}**` 
                    });
                }
                return;
            }

            // MODO 2: Min/Max Simples (Legado)
            let min = parseInt(params[0]);
            let max = parseInt(params[1]);

            if (isNaN(min)) min = 0;
            if (isNaN(max)) max = 100;
            
            if (min > max) {
                return sendLocalMessage("Erro: O minimo nao pode ser maior que o maximo.");
            }

            const result = Math.floor(Math.random() * (max - min + 1)) + min;
            
            if (window.CLIENT.name === data.username) {
                window.socket.emit("chatMsg", { msg: `/me rolou [${min}-${max}]: **${result}**` });
            }
        }
    },

    // Comando: Ask (Bola 8)
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
                const pergunta = params.join(" "); 
                window.socket.emit("chatMsg", { msg: `/me 🎱 para "${pergunta}": ${resposta}` });
            }
        }
    },

    // Comando: Moeda
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
    
    setTimeout(() => {
        sendLocalMessage(`Modulo de Comandos carregado. Use ${config.prefix}help`);
    }, 1000);
}

export default {
    init
};
