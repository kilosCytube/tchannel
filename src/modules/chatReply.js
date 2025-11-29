// src/modules/chatReply.js

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
    console.log("[ChatReply] Inicializando sistema de respostas (v4)...");

    window.replyToMessage = replyToId;
    window.scrollToMessage = scrollToMessage;

    const targetNode = document.getElementById("messagebuffer");
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (!node.className || !node.className.includes('chat-msg-')) continue;

                // --- FILTRO DE SEGURANÇA ---
                // Ignora mensagens do sistema (server whisper)
                if (node.querySelector('.server-whisper')) continue;
                // Ignora mensagens de aviso/erro do sistema
                if (node.classList.contains('server-msg-reconnect')) continue;
                // ---------------------------

                // 1. Botão de Reply (Canto Direito)
                if (!node.querySelector('.reply-btn')) {
                    const btn = document.createElement('span');
                    btn.className = 'reply-btn';
                    btn.innerHTML = '↩'; 
                    btn.title = "Responder";
                    btn.onclick = () => {
                        const id = node.getAttribute('data-msg-id');
                        if (id) replyToId(id);
                        else if (window.generateMsgId) {
                            // Tenta reconstruir o ID se necessário
                            const timestamp = node.querySelector('.timestamp')?.innerText || "";
                            const newId = window.generateMsgId(
                                node.className.split('-')[2], 
                                node.innerText, 
                                timestamp
                            );
                            replyToId(newId);
                        }
                    };
                    
                    // Prepend insere como primeiro filho. 
                    // Com float: right no CSS, ele vai para o canto direito superior.
                    node.prepend(btn);
                }

                // 2. Renderizar Caixa de Resposta (Lógica Mantida)
                const allSpans = node.querySelectorAll('span');
                let found = false;

                for (let span of allSpans) {
                    if (found) break;
                    if (span.classList.contains('timestamp') || 
                        span.classList.contains('username') ||
                        span.classList.contains('reply-btn')) continue;

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
