// src/modules/chatReply.js

// Injeta o CSS automaticamente se não estiver presente
const styles = `
.reply-btn { cursor: pointer; margin-left: 6px; font-size: 0.9em; color: #888; transition: color 0.2s; }
.reply-btn:hover { color: #ffcc00; }
.reply-box { position: relative; background-color: rgba(60, 60, 60, 0.4); border-left: 4px solid #627b83; border-radius: 6px; padding: 4px 8px; margin: 4px 0 6px 0; font-size: 0.85em; cursor: pointer; width: fit-content; max-width: 95%; overflow: hidden; display: flex; flex-direction: column; transition: background-color 0.2s; }
.reply-box:hover { background-color: rgba(80, 80, 80, 0.5); border-left-color: #8aaeb8; }
.reply-header { font-weight: bold; color: #aaa; font-size: 0.9em; margin-bottom: 2px; }
.reply-msg { color: #ddd; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
    
    // Substitui reply anterior
    let currentText = chatline.value.replace(/^\.reply\s+\S+\s*/, "");
    chatline.value = `.reply ${id} ${currentText}`;
    chatline.focus();
}

function scrollToMessage(id) {
    const target = document.querySelector(`[data-msg-id="${id}"]`);
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        
        // Remove animação anterior se houver para reiniciar
        target.classList.remove("highlight-anim");
        void target.offsetWidth; // Força reflow
        
        // Adiciona classe de animação (definida no CSS ou manual aqui)
        target.style.transition = "background-color 0.5s";
        const originalBg = target.style.backgroundColor;
        target.style.backgroundColor = "rgba(255, 255, 0, 0.15)";
        setTimeout(() => { target.style.backgroundColor = originalBg; }, 1500);
    } else {
        console.warn("[ChatReply] Mensagem original não encontrada.");
    }
}

function createReplyHeader(targetId) {
    const targetMsg = document.querySelector(`[data-msg-id="${targetId}"]`);
    let username = "Desconhecido";
    let text = "Mensagem antiga ou apagada";

    if (targetMsg) {
        // Lógica robusta para pegar nome (inspirada no Bokitube)
        const userSpan = targetMsg.querySelector('.username');
        if (userSpan) username = userSpan.innerText.replace(/:$/, ''); // Remove dois pontos do final se tiver
        else {
            const classList = targetMsg.className.split(' ');
            const userClass = classList.find(c => c.startsWith('chat-msg-'));
            if (userClass) username = userClass.replace('chat-msg-', '');
        }

        // Pega texto limpando lixo HTML
        // Clona o nodo para não estragar o original ao manipular
        const clone = targetMsg.cloneNode(true);
        // Remove elementos de "metadados" para sobrar só o texto
        const toRemove = clone.querySelectorAll('.timestamp, .username, .reply-btn, .reply-box');
        toRemove.forEach(el => el.remove());
        
        text = clone.innerText.trim();
        if (text.length > 60) text = text.substring(0, 60) + "...";
    }

    // Estrutura HTML "Bokitube Style"
    return `<div class="reply-box" onclick="window.scrollToMessage('${targetId}')">
                <span class="reply-header">↪ Respondendo a ${username}:</span> 
                <span class="reply-msg">${text}</span>
            </div>`;
}

function init() {
    console.log("[ChatReply] Inicializando estilo Bokitube...");
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

                // 1. Botão de Reply
                if (!node.querySelector('.reply-btn')) {
                    const timestamp = node.querySelector('.timestamp');
                    if (timestamp) {
                        const btn = document.createElement('span');
                        btn.className = 'reply-btn';
                        btn.innerHTML = '↩'; 
                        btn.title = "Responder";
                        btn.onclick = () => {
                            const id = node.getAttribute('data-msg-id');
                            if (id) replyToId(id);
                            else if (window.generateMsgId) {
                                // Fallback gerando ID na hora
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

                // 2. Renderizar Caixa de Resposta
                const allSpans = node.querySelectorAll('span');
                let found = false;

                for (let span of allSpans) {
                    if (found) break;
                    if (span.classList.contains('timestamp') || span.classList.contains('username')) continue;

                    const text = span.innerHTML;
                    // Regex busca .reply no início, ignorando tags HTML anteriores se houver
                    const match = text.match(/^\s*\.reply\s+(\d+)/i);

                    if (match) {
                        found = true;
                        const replyId = match[1];
                        const fullMatch = match[0];

                        const headerHtml = createReplyHeader(replyId);
                        const previewDiv = document.createElement("div");
                        previewDiv.innerHTML = headerHtml;

                        // Remove o comando do texto
                        span.innerHTML = text.replace(fullMatch, "").trim();

                        // INSERÇÃO CORRIGIDA:
                        // O Bokitube insere um DIV block.
                        // Para não quebrar a linha do nome, inserimos ANTES do span de texto,
                        // mas como é um DIV, ele naturalmente vai para uma "linha própria" visualmente
                        // empurrando o texto para baixo, o que cria o efeito "Cartão".
                        span.parentNode.insertBefore(previewDiv, span);
                    }
                }
            }
        }
    });

    observer.observe(targetNode, { childList: true });
}

export default { init };
