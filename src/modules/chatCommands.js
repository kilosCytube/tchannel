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
        usage: "Limpa todas as mensagens da sua janela de chat.\nIsso afeta apenas voce, nao os outros usuarios.\n\nUso: .clear",
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
        description: "Rola dados (RPG ou Simples).",
        usage: "Rola dados de RPG ou faz sorteios simples.\n\n" +
               "Modo RPG:\n" +
               ".roll 1d20 (Rola 1 dado de 20 lados)\n" +
               ".roll 2d6+5 (2 dados de 6 lados + 5)\n" +
               ".roll 1d20 + 1d4 (Soma dados diferentes)\n\n" +
               "Modo Simples:\n" +
               ".roll 100 (Sorteia entre 0 e 100)\n" +
               ".roll 1 10 (Sorteia entre 1 e 10)",
        run: (params, data) => {
            const fullText = params.join("").toLowerCase();

            // MODO 1: RPG (se tiver 'd')
            if (fullText.includes("d")) {
                let total = 0;
                let details = []; 
                
                const regex = /([+-]?)(\d+)d(\d+)|([+-]?)(\d+)/g;
                let match;

                while ((match = regex.exec(fullText)) !== null) {
                    if (match[0] === "") continue;

                    // Dado (ex: 1d20)
                    if (match[3]) {
                        const sign = match[1] === "-" ? -1 : 1;
                        const count = parseInt(match[2]);
                        const faces = parseInt(match[3]);

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
                        
                        const signStr = sign === -1 ? "- " : "+ ";
                        const rollsStr = count === 1 ? rolls[0] : `[${rolls.join(", ")}]`;
                        details.push(`${signStr}${count}d${faces}:${rollsStr}`);
                    } 
                    // Modificador fixo (ex: +5)
                    else if (match[5]) {
                        const sign = match[4] === "-" ? -1 : 1;
                        const val = parseInt(match[5]);
                        total += (val * sign);
                        
                        const signStr = sign === -1 ? "- " : "+ ";
                        details.push(`${signStr}${val}`);
                    }
                }

                let detailsText = details.join(" ");
                if (detailsText.startsWith("+ ")) detailsText = detailsText.substring(2);

                if (window.CLIENT.name === data.username) {
                    window.socket.emit("chatMsg", { 
                        msg: `/me 🎲 **${total}** ⇐ ${detailsText}` 
                    });
                }
                return;
            }

            // MODO 2: Simples
            let min = parseInt(params[0]);
            let max = parseInt(params[1]);

            if (isNaN(min)) min = 0;
            if (isNaN(max)) max = 100;
            
            if (min > max) return sendLocalMessage("Erro: Min > Max.");

            const result = Math.floor(Math.random() * (max - min + 1)) + min;
            
            if (window.CLIENT.name === data.username) {
                window.socket.emit("chatMsg", { msg: `/me 🎲 Sorteio [${min}-${max}]: **${result}**` });
            }
        }
    },

    // Comando: Ask
    ask: {
        description: "Responde sua pergunta com o destino.",
        usage: "A lendaria Bola 8 Magica responde suas duvidas de Sim ou Nao.\n\n" +
               "Uso: .ask <pergunta>\n" +
               "Exemplo: .ask Devo pedir pizza hoje?",
        run: (params, data) => {
            if (params.length === 0) return sendLocalMessage("Voce precisa fazer uma pergunta!");

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
        usage: "Joga uma moeda para decidir a sorte (50/50).\n\nUso: .moeda",
        run: (params, data) => {
            const lado = Math.random() > 0.5 ? "Cara" : "Coroa";
            if (window.CLIENT.name === data.username) {
                window.socket.emit("chatMsg", { msg: `/me jogou uma moeda e caiu: ${lado}` });
            }
        }
    },

    // Comando: Amor
    amor: {
        description: "Calcula a compatibilidade amorosa.",
        usage: "Calcula a porcentagem de amor entre duas pessoas (ou coisas).\n" +
               "O resultado e puramente aleatorio e para diversao.\n\n" +
               "Uso: .amor <Nome 1> <Nome 2>\n" +
               "Exemplo: .amor Romeu Julieta",
        run: (params, data) => {
            if (params.length < 2) return sendLocalMessage("Uso: .amor <Pessoa 1> <Pessoa 2>");

            const nomes = params.join(" ");
            const porcentagem = Math.floor(Math.random() * 101);
            
            let msgFim = "";
            if (porcentagem < 20) msgFim = "💔 Sem chance!";
            else if (porcentagem < 50) msgFim = "🤔 Talvez apenas amigos.";
            else if (porcentagem < 90) msgFim = "🔥 Ta esquentando!";
            else msgFim = "💖 E o destino!";

            if (window.CLIENT.name === data.username) {
                window.socket.emit("chatMsg", { 
                    msg: `/me 💘 Compatibilidade [${nomes}]: **${porcentagem}%** ${msgFim}` 
                });
            }
        }
    },

    // Comando: Tapa
    tapa: {
        description: "Da um tapa virtual em alguem.",
        usage: "Interacao de roleplay. Da um tapa em alguem usando um objeto aleatorio.\n\n" +
               "Uso: .tapa <Usuario>\n" +
               "Exemplo: .tapa @Admin",
        run: (params, data) => {
            if (params.length === 0) return sendLocalMessage("Quem voce quer tapear?");
            
            const alvo = params.join(" ");
            const objetos = ["uma truta grande", "uma luva de pelica", "um teclado mecanico", "um chinelo havaiana", "um pe de cabra"];
            const obj = objetos[Math.floor(Math.random() * objetos.length)];

            if (window.CLIENT.name === data.username) {
                window.socket.emit("chatMsg", { 
                    msg: `/me deu um tapa em ${alvo} com ${obj}!` 
                });
            }
        }
    },

    // Comando: Math (Calculadora)
    math: {
        description: "Calculadora simples (+ - * /).",
        usage: "Realiza contas matematicas rapidas.\n" +
               "Suporta soma (+), subtracao (-), multiplicacao (*) e divisao (/).\n\n" +
               "Uso: .math <expressao>\n" +
               "Exemplo: .math 10 * 5 + 2",
        run: (params, data) => {
            try {
                const expressao = params.join("").replace(/[^0-9+\-*/().]/g, "");
                if (!expressao) return sendLocalMessage("Digite uma conta valida.");

                const resultado = new Function('return ' + expressao)();

                if (window.CLIENT.name === data.username) {
                    window.socket.emit("chatMsg", { 
                        msg: `/me 🧮 Calculou: ${expressao} = **${resultado}**` 
                    });
                }
            } catch (e) {
                sendLocalMessage("Erro na conta. Use apenas numeros e + - * /");
            }
        }
    },

    // Comando: Ajuda (Atualizado)
    help: {
        description: "Mostra a lista de comandos ou ajuda especifica.",
        usage: "Mostra a lista de todos os comandos.\n" +
               "Para ver detalhes de um comando especifico, digite o nome dele.\n\n" +
               "Uso: .help\n" +
               "Uso: .help roll",
        run: (params, data) => {
            // Caso 1: Ajuda Específica (.help roll)
            if (params.length > 0) {
                // Remove o prefixo caso o usuário tenha digitado .help .roll
                const cmdName = params[0].toLowerCase().replace(config.prefix, "");
                const cmd = commands[cmdName];

                if (cmd) {
                    let msg = `=== Ajuda: ${config.prefix}${cmdName} ===\n`;
                    msg += `${cmd.description}\n\n`;
                    msg += `[Como Usar]\n${cmd.usage}`;
                    sendLocalMessage(msg);
                } else {
                    sendLocalMessage(`Comando '${cmdName}' nao encontrado.`);
                }
                return;
            }

            // Caso 2: Lista Geral (.help)
            let msg = "--- Comandos Disponiveis ---\n";
            msg += `Dica: Use ${config.prefix}help <comando> para detalhes.\n\n`;
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
 * Inicialização
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
