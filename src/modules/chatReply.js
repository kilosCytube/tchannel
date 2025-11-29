// src/modules/chatReply.js

const styles = `
/* Garante que a mensagem seja a referência para o botão absoluto */
div[class*="chat-msg-"] {
    position: relative !important;
}

/* Botão de Reply (Posicionamento Absoluto) */
.reply-btn {
    position: absolute;
    top: 2px;      /* Distância do topo */
    right: 5px;    /* Distância da direita (fixa, independente da scrollbar) */
    cursor: pointer;
    font-size: 1.1em;
    color: #888;
    opacity: 0;
    transition: opacity 0.2s, color 0.2s;
    user-select: none;
    z-index: 10;   /* Garante que fique acima de tudo */
}

/* Mostra ao passar o mouse na mensagem */
div[class*="chat-msg-"]:hover .reply-btn {
    opacity: 1;
}

.reply-btn:hover {
    color: #ffcc00;
    opacity: 1 !important;
    text-shadow: 0 0 3px rgba(0,0,0,0.5);
}

/* Caixa de Resposta */
.reply-box {
    /* clear: both não é mais necessário com absolute, mas mal não faz */
    clear: both;
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: rgba(60, 60, 60, 0.4);
    border-left: 4px solid #627b83;
    border-radius: 4px;
    padding: 4px 8px;
    margin: 4px 0 6px 0;
    width: fit-content;
    max-width: 90%; /* Deixa espaço para o botão não sobrepor texto longo */
    font-size: 0.85em;
    cursor: pointer;
    transition: background-color 0.2s;
}
.reply-box:hover { background-color: rgba(80, 80, 80, 0.5); border-left-color: #8aaeb8; }
.reply-header { font-weight: bold; color: #aaa; font-size: 0.9em; margin-bottom: 2px; }
.reply-msg { color: #ddd; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Animação */
.highlight-anim { animation: reply-flash 1.5s ease-out; }
@keyframes reply-flash { 0% { background-color: rgba(255, 255, 0, 0.3); } 100% { background-color: transparent; } }
`;

function injectStyles() {
    if (!document.getElementById('chat-reply-css')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'chat-reply-css';
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
    }
}

function replyToId(id) {
    const chatline = document.getElementById("chatline");
    if (!chatline) return;
    
    let currentText = chatline.value.replace(/^\.reply\s+\S+\s*/, "");
    chatline.value = `.reply ${id} ${currentText}`;
    chatline.focus();
}

function scrollToMessage(id) {
    const target = document.querySelector(`[data-msg-id="${id}"]`);
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.remove("highlight-anim");
        void target.offsetWidth; 
        target.classList.add("highlight-anim");
    } else {
        console.warn("[ChatReply] Mensagem original não encontrada.");
    }
}

function createReplyHeader(targetId) {
    const targetMsg = document.querySelector(`[data-msg-id="${targetId}"]`);
    let username = "Desconhecido";
    let text = "Mensagem antiga ou apagada";

    if (targetMsg) {
        const userSpan = targetMsg.querySelector('.username');
        if (userSpan) username = userSpan.innerText.replace(/:$/, ''); 
        else {
            const classList = targetMsg.className.split(' ');
            const userClass = classList.find(c => c.startsWith('chat-msg-'));
            if (userClass) username = userClass.replace('chat-msg-', '');
        }

        const clone = targetMsg.cloneNode(true);
        const toRemove = clone.querySelectorAll('.timestamp, .username, .reply-btn, .reply-box');
        toRemove.forEach(el => el.remove());
        
        text = clone.innerText.trim();
        if (text.length > 60) text = text.substring(0, 60) + "...";
    }

    return `<div class="reply-box" onclick="window.scrollToMessage('${targetId}')">
                <span class="reply-header">↪ Respondendo a ${username}:</span> 
                <span class="reply-msg">${text}</span>
            </div>`;
}

function init() {
    console.log("[ChatReply] Inicializando (Posicionamento Absoluto)...");
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

                if (node.querySelector('.server-whisper') || node.classList.contains('server-msg-reconnect')) continue;

                // 1. Inserir Botão (Agora com Append, pois é absoluto)
                if (!node.querySelector('.reply-btn')) {
                    const btn = document.createElement('span');
                    btn.className = 'reply-btn';
                    btn.innerHTML = '↩'; 
                    btn.title = "Responder";
                    btn.onclick = () => {
                        const id = node.getAttribute('data-msg-id');
                        if (id) replyToId(id);
                        else if (window.generateMsgId) {
                            const timestamp = node.querySelector('.timestamp')?.innerText || "";
                            const newId = window.generateMsgId(node.className.split('-')[2], node.innerText, timestamp);
                            replyToId(newId);
                        }
                    };
                    
                    // Com position: absolute, tanto faz ser append ou prepend, 
                    // mas append no final garante que fique "sobre" o texto se houver colisão
                    node.appendChild(btn);
                }

                // 2. Renderizar Caixa de Resposta
                const allSpans = node.querySelectorAll('span');
                let found = false;

                for (let span of allSpans) {
                    if (found) break;
                    if (span.classList.contains('timestamp') || span.classList.contains('username') || span.classList.contains('reply-btn')) continue;

                    const text = span.innerHTML;
                    const match = text.match(/^\s*\.reply\s+(\d+)/i);

                    if (match) {
                        found = true;
                        const replyId = match[1];
                        const fullMatch = match[0];

                        const headerHtml = createReplyHeader(replyId);
                        const previewDiv = document.createElement("div");
                        previewDiv.innerHTML = headerHtml;

                        span.innerHTML = text.replace(fullMatch, "").trim();
                        span.parentNode.insertBefore(previewDiv, span);
                    }
                }
            }
        }
    });

    observer.observe(targetNode, { childList: true });
}

export default { init };
