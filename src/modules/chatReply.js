// src/modules/chatReply.js

// 1. Injeta CSS automaticamente para garantir que funcione
const styles = `
.reply-btn { font-size: 0.9em; opacity: 0.6; cursor: pointer; margin-left: 5px; color: #888; }
.reply-btn:hover { opacity: 1; color: #ffcc00; }
.reply-preview {
    display: block;
    background-color: rgba(0, 0, 0, 0.2);
    border-left: 3px solid #aaa;
    padding: 2px 6px;
    margin: 4px 0 2px 20px;
    font-size: 0.85em;
    cursor: pointer;
    border-radius: 0 4px 4px 0;
    width: fit-content;
    max-width: 90%;
}
.reply-preview:hover { background-color: rgba(0, 0, 0, 0.4); border-left-color: #fff; }
.reply-user { font-weight: bold; margin-right: 5px; color: #ccc; }
.reply-text { font-style: italic; color: #999; }
`;

function injectStyles() {
    if (!document.getElementById('chat-reply-css')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'chat-reply-css';
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
    }
}

// 2. Funções de Ação
function replyToId(id) {
    const chatline = document.getElementById("chatline");
    if (!chatline) return;
    
    let currentText = chatline.value.replace(/^\.reply\s+\S+\s*/, "");
    chatline.value = `.reply ${id} ${currentText}`;
    chatline.focus();
}

function scrollToMessage(id) {
    let target = document.querySelector(`[data-msg-id="${id}"]`);
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.style.transition = "background-color 0.5s";
        const originalBg = target.style.backgroundColor;
        target.style.backgroundColor = "rgba(255, 255, 0, 0.15)";
        setTimeout(() => { target.style.backgroundColor = originalBg; }, 1500);
    } else {
        console.warn("[ChatReply] Mensagem não encontrada.");
    }
}

function createReplyHeader(targetId) {
    const targetMsg = document.querySelector(`[data-msg-id="${targetId}"]`);
    let username = "Desconhecido";
    let text = "Mensagem antiga...";

    if (targetMsg) {
        // Tenta achar o nome de várias formas
        const userSpan = targetMsg.querySelector('.username');
        if (userSpan) username = userSpan.innerText;
        else {
            // Fallback pela classe
            const classList = targetMsg.className.split(' ');
            const userClass = classList.find(c => c.startsWith('chat-msg-'));
            if (userClass) username = userClass.replace('chat-msg-', '');
        }

        // Pega o texto da mensagem original
        // Varre spans para achar o texto, ignorando nome e hora
        const allSpans = targetMsg.querySelectorAll('span');
        for (let span of allSpans) {
            if (!span.classList.contains('timestamp') && !span.classList.contains('username')) {
                text = span.innerText;
                break;
            }
        }
        
        if (text.length > 50) text = text.substring(0, 50) + "...";
    }

    return `<div class="reply-preview" onclick="window.scrollToMessage('${targetId}')">
                <span class="reply-user">↩ ${username}:</span> 
                <span class="reply-text">${text}</span>
            </div>`;
}

function init() {
    console.log("[ChatReply] Inicializando sistema de respostas (v3)...");
    injectStyles();

    window.replyToMessage = replyToId;
    window.scrollToMessage = scrollToMessage;

    const targetNode = document.getElementById("messagebuffer");
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (!node.className || !node.className.includes('chat-msg-')) continue;

                // A. Adicionar Botão de Reply
                if (!node.querySelector('.reply-btn')) {
                    const timestamp = node.querySelector('.timestamp');
                    if (timestamp) {
                        const btn = document.createElement('span');
                        btn.className = 'reply-btn';
                        btn.innerHTML = ' ↩'; 
                        btn.title = "Responder";
                        btn.onclick = () => {
                            const id = node.getAttribute('data-msg-id');
                            // Tenta pegar ID do atributo ou gerar na hora se falhar
                            if (id) replyToId(id);
                            else if (window.generateMsgId) {
                                const newId = window.generateMsgId(
                                    node.className.split('-')[2], 
                                    node.innerText, 
                                    timestamp.innerText
                                );
                                replyToId(newId);
                            }
                        };
                        timestamp.parentNode.insertBefore(btn, timestamp.nextSibling);
                    }
                }

                // B. Detectar e Formatar .reply (Varredura Robusta)
                const allSpans = node.querySelectorAll('span');
                let found = false;

                // Procura em TODOS os spans da mensagem
                for (let span of allSpans) {
                    if (found) break; // Já achou e processou

                    // Ignora timestamp e username
                    if (span.classList.contains('timestamp') || span.classList.contains('username')) continue;

                    // Verifica o texto
                    const text = span.innerHTML.trim(); // Trim remove espaços extras do começo
                    
                    // Regex mais permissiva: Permite espaços antes do .reply
                    // ^\s* = começo da string, espaços opcionais
                    const match = text.match(/^\s*\.reply\s+(\d+)/i);

                    if (match) {
                        found = true;
                        const replyId = match[1];
                        const fullMatch = match[0]; // ".reply 123456"

                        // Cria a caixinha
                        const headerHtml = createReplyHeader(replyId);
                        const previewDiv = document.createElement("div");
                        previewDiv.innerHTML = headerHtml;

                        // Limpa o comando do texto
                        span.innerHTML = text.replace(fullMatch, "").trim();

                        // Insere a caixinha ANTES desse span de texto
                        span.parentNode.insertBefore(previewDiv, span);
                    }
                }
            }
        }
    });

    observer.observe(targetNode, { childList: true });
}

export default { init };
