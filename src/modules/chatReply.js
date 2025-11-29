// src/modules/chatReply.js

function replyToId(id) {
    const chatline = document.getElementById("chatline");
    if (!chatline) return;
    
    // Substitui reply anterior se houver
    let currentText = chatline.value.replace(/^\.reply\s+\S+\s*/, "");
    chatline.value = `.reply ${id} ${currentText}`;
    chatline.focus();
}

function scrollToMessage(id) {
    const target = document.querySelector(`[data-msg-id="${id}"]`);
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        
        // Remove animação anterior para poder tocar de novo
        target.classList.remove("highlight-anim");
        void target.offsetWidth; // Hack para forçar o navegador a reiniciar a animação
        
        // Adiciona a classe que faz o flash (definida no CSS da sala)
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
        // Tenta pegar o nome de forma limpa
        const userSpan = targetMsg.querySelector('.username');
        if (userSpan) username = userSpan.innerText.replace(/:$/, ''); 
        else {
            const classList = targetMsg.className.split(' ');
            const userClass = classList.find(c => c.startsWith('chat-msg-'));
            if (userClass) username = userClass.replace('chat-msg-', '');
        }

        // Clona para limpar elementos indesejados (botões, hora) e pegar só o texto
        const clone = targetMsg.cloneNode(true);
        const toRemove = clone.querySelectorAll('.timestamp, .username, .reply-btn, .reply-box');
        toRemove.forEach(el => el.remove());
        
        text = clone.innerText.trim();
        if (text.length > 60) text = text.substring(0, 60) + "...";
    }

    // HTML Limpo (As classes são estilizadas no CSS da sala)
    return `<div class="reply-box" onclick="window.scrollToMessage('${targetId}')">
                <span class="reply-header">↪ Respondendo a ${username}:</span> 
                <span class="reply-msg">${text}</span>
            </div>`;
}

function init() {
    console.log("[ChatReply] Módulo iniciado (Estilo via CSS externo)...");

    // Expõe funções para o HTML onclick
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
                            // Tenta pelo atributo, ou gera na hora (fallback)
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

                // 2. Renderizar Caixa de Resposta
                const allSpans = node.querySelectorAll('span');
                let found = false;

                for (let span of allSpans) {
                    if (found) break;
                    if (span.classList.contains('timestamp') || span.classList.contains('username')) continue;

                    const text = span.innerHTML;
                    // Regex busca .reply ID no início do texto
                    const match = text.match(/^\s*\.reply\s+(\d+)/i);

                    if (match) {
                        found = true;
                        const replyId = match[1];
                        const fullMatch = match[0];

                        const headerHtml = createReplyHeader(replyId);
                        const previewDiv = document.createElement("div");
                        previewDiv.innerHTML = headerHtml;

                        // Limpa o comando ".reply ID" do texto visível
                        span.innerHTML = text.replace(fullMatch, "").trim();

                        // Insere a caixa antes do texto
                        span.parentNode.insertBefore(previewDiv, span);
                    }
                }
            }
        }
    });

    observer.observe(targetNode, { childList: true });
}

export default { init };
