// src/modules/chatReply.js

function replyToId(id) {
    const chatline = document.getElementById("chatline");
    if (!chatline) return;

    // Limpa reply anterior se houver
    let currentText = chatline.value.replace(/^\.reply\s+\S+\s*/, "");
    
    // Adiciona o comando no início
    chatline.value = `.reply ${id} ${currentText}`;
    chatline.focus();
}

function scrollToMessage(id) {
    const target = document.querySelector(`[data-msg-id="${id}"]`);
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        
        // Efeito de destaque
        target.style.transition = "background-color 0.5s";
        const originalBg = target.style.backgroundColor;
        target.style.backgroundColor = "rgba(255, 255, 0, 0.15)"; // Marca-texto suave
        setTimeout(() => {
            target.style.backgroundColor = originalBg;
        }, 1500);
    } else {
        console.warn("[ChatReply] Mensagem original não encontrada no buffer.");
    }
}

function createReplyHeader(targetId) {
    // Busca a mensagem original pelo ID
    const targetMsg = document.querySelector(`[data-msg-id="${targetId}"]`);
    
    let username = "Desconhecido";
    let text = "Mensagem antiga ou apagada";

    if (targetMsg) {
        // Extrai Username
        const classList = targetMsg.className.split(' ');
        const userClass = classList.find(c => c.startsWith('chat-msg-'));
        if (userClass) username = userClass.replace('chat-msg-', '');

        // Extrai Texto (remove timestamp e username da busca)
        const textSpan = targetMsg.querySelector('span:not(.timestamp):not(.username)');
        if (textSpan) text = textSpan.innerText;
        
        // Trunca texto longo
        if (text.length > 60) text = text.substring(0, 60) + "...";
    }

    // Retorna o HTML do card de resposta
    return `<div class="reply-preview" onclick="window.scrollToMessage('${targetId}')">
                <span class="reply-user">↩ ${username}:</span> 
                <span class="reply-text">${text}</span>
            </div>`;
}

function init() {
    console.log("[ChatReply] Inicializando sistema de respostas (.reply)...");

    // Expõe funções globais para o HTML injetado
    window.replyToMessage = replyToId;
    window.scrollToMessage = scrollToMessage;

    const targetNode = document.getElementById("messagebuffer");
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (!node.className || !node.className.includes('chat-msg-')) continue;

                // 1. Inserir Botão de Reply (setinha)
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
                            if (id) replyToId(id);
                            // Fallback caso o ID não tenha sido gerado a tempo (raro)
                            else console.warn("[ChatReply] Aguarde, processando ID...");
                        };
                        
                        // Insere logo após o timestamp
                        timestamp.parentNode.insertBefore(btn, timestamp.nextSibling);
                    }
                }

                // 2. Detectar e Formatar o Comando .reply
                // CORREÇÃO: Pegamos apenas o span da mensagem, não o HTML todo da linha
                const msgSpan = node.querySelector('span:not(.timestamp):not(.username)');
                
                if (msgSpan) {
                    const msgText = msgSpan.innerHTML;
                    // Regex busca .reply no início do TEXTO da mensagem
                    const replyRegex = /^\.reply\s+(\S+)/i;
                    const match = msgText.match(replyRegex);

                    if (match) {
                        const replyId = match[1]; // ID capturado
                        const fullCmd = match[0]; // O texto ".reply 123456"
                        
                        const headerHtml = createReplyHeader(replyId);

                        // Remove o comando feio do texto visível
                        msgSpan.innerHTML = msgText.replace(fullCmd, "").trim();
                        
                        // Cria o elemento visual da resposta
                        const previewDiv = document.createElement("div");
                        previewDiv.innerHTML = headerHtml;
                        
                        // Insere a caixinha ANTES do texto da mensagem (mas depois do nome)
                        // Estrutura: [Time] [User] [ReplyBox] [Msg]
                        if (msgSpan.parentNode) {
                            msgSpan.parentNode.insertBefore(previewDiv, msgSpan);
                        }
                    }
                }
            }
        }
    });

    observer.observe(targetNode, { childList: true });
}

export default { init };
