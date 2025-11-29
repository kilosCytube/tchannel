// src/modules/chatReply.js

function replyToId(id) {
    const chatline = document.getElementById("chatline");
    if (!chatline) return;

    // Remove qualquer comando .reply anterior para não acumular
    // Regex: Começa com .reply, espaços, ID (não-espaço), espaços
    let currentText = chatline.value.replace(/^\.reply\s+\S+\s*/, "");
    
    // Adiciona o novo formato no início: .reply <ID> <Texto>
    chatline.value = `.reply ${id} ${currentText}`;
    chatline.focus();
}

function scrollToMessage(id) {
    let target = document.querySelector(`[data-msg-id="${id}"]`);
    
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.style.transition = "background-color 0.3s";
        const originalBg = target.style.backgroundColor;
        target.style.backgroundColor = "rgba(255, 255, 0, 0.2)"; 
        setTimeout(() => {
            target.style.backgroundColor = originalBg;
        }, 1000);
    } else {
        console.warn("[ChatReply] Mensagem não encontrada no buffer.");
    }
}

function createReplyHeader(targetId) {
    const targetMsg = document.querySelector(`[data-msg-id="${targetId}"]`);
    
    let username = "Desconhecido";
    let text = "Mensagem antiga ou apagada";

    if (targetMsg) {
        const classList = targetMsg.className.split(' ');
        const userClass = classList.find(c => c.startsWith('chat-msg-'));
        if (userClass) username = userClass.replace('chat-msg-', '');

        const textSpan = targetMsg.querySelector('span:not(.timestamp):not(.username)');
        if (textSpan) text = textSpan.innerText;
        
        if (text.length > 50) text = text.substring(0, 50) + "...";
    }

    return `<div class="reply-preview" onclick="window.scrollToMessage('${targetId}')">
                <span class="reply-user">↩ ${username}:</span> 
                <span class="reply-text">${text}</span>
            </div>`;
}

function init() {
    console.log("[ChatReply] Inicializando sistema de respostas (.reply)...");

    window.replyToMessage = replyToId;
    window.scrollToMessage = scrollToMessage;

    const targetNode = document.getElementById("messagebuffer");
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (!node.className || !node.className.includes('chat-msg-')) continue;

                // 1. Adicionar Botão de Reply (Igual ao anterior)
                if (!node.querySelector('.reply-btn')) {
                    const timestamp = node.querySelector('.timestamp');
                    if (timestamp) {
                        const btn = document.createElement('span');
                        btn.className = 'reply-btn pointer';
                        btn.innerHTML = ' ↩'; 
                        btn.title = "Responder";
                        btn.style.cursor = "pointer";
                        btn.style.marginLeft = "5px";
                        
                        btn.onclick = () => {
                            const id = node.getAttribute('data-msg-id');
                            if (id) {
                                replyToId(id);
                            } else {
                                // Fallback se o ID ainda não foi gerado
                                const newId = window.generateMsgId ? 
                                    window.generateMsgId(
                                        node.className.split('-')[2], 
                                        node.innerText, 
                                        timestamp.innerText
                                    ) : null;
                                if (newId) replyToId(newId);
                            }
                        };
                        timestamp.parentNode.insertBefore(btn, timestamp.nextSibling);
                    }
                }

                // 2. Processar a visualização (.reply ID)
                const msgBody = node.innerHTML;
                
                // MUDANÇA AQUI: Regex para capturar .reply <ID>
                // ^ = inicio, \.reply = literal, \s+ = espaço, (\S+) = ID (sem espaço)
                const replyRegex = /^\.reply\s+(\S+)/;
                const match = msgBody.match(replyRegex);

                if (match) {
                    const replyId = match[1]; // O ID (ex: 123456)
                    const fullCmd = match[0]; // O comando todo (ex: ".reply 123456")
                    
                    const headerHtml = createReplyHeader(replyId);

                    // Remove o comando ".reply 123456" do texto visível
                    // O replace remove apenas a primeira ocorrência, o que é correto
                    node.innerHTML = node.innerHTML.replace(replyRegex, "");
                    
                    // Insere a caixinha de preview
                    const refElement = node.querySelector('.username') || node.querySelector('.timestamp');
                    if (refElement) {
                        const previewDiv = document.createElement("div");
                        previewDiv.innerHTML = headerHtml;
                        
                        if (refElement.nextSibling) {
                             node.insertBefore(previewDiv, refElement.nextSibling.nextSibling);
                        } else {
                             node.appendChild(previewDiv);
                        }
                    }
                }
            }
        }
    });

    observer.observe(targetNode, { childList: true });
}

export default { init };
