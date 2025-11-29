// src/modules/chatReply.js

function replyToId(id) {
    const chatline = document.getElementById("chatline");
    if (!chatline) return;

    // Remove tags de reply anteriores para não acumular
    let currentText = chatline.value.replace(/\[r\].*?\[\/r\]\s*/g, "");
    
    // Adiciona o novo reply no início
    chatline.value = `[r]${id}[/r] ${currentText}`;
    chatline.focus();
}

function scrollToMessage(id) {
    const target = document.querySelector(`[data-msg-id="${id}"]`);
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        // Efeito de flash para destacar
        target.style.transition = "background-color 0.3s";
        const originalBg = target.style.backgroundColor;
        target.style.backgroundColor = "rgba(255, 255, 0, 0.2)"; // Amarelo suave
        setTimeout(() => {
            target.style.backgroundColor = originalBg;
        }, 1000);
    } else {
        // Fallback visual se a mensagem não estiver mais no buffer
        console.warn("[ChatReply] Mensagem original não encontrada no buffer.");
    }
}

function createReplyHeader(targetId) {
    // Tenta encontrar a mensagem original no DOM
    const targetMsg = document.querySelector(`[data-msg-id="${targetId}"]`);
    
    let username = "Desconhecido";
    let text = "Mensagem antiga ou apagada";

    if (targetMsg) {
        // Extrai o nome de usuário da classe (chat-msg-Username)
        const classList = targetMsg.className.split(' ');
        const userClass = classList.find(c => c.startsWith('chat-msg-'));
        if (userClass) username = userClass.replace('chat-msg-', '');

        // Pega o texto (ignora timestamp e botões)
        // Nota: O seletor pode variar levemente dependendo do tema, mas geralmente é o último span
        const textSpan = targetMsg.querySelector('span:not(.timestamp):not(.username)');
        if (textSpan) text = textSpan.innerText;
        
        // Limita o tamanho do texto no preview
        if (text.length > 50) text = text.substring(0, 50) + "...";
    }

    return `<div class="reply-preview" onclick="window.scrollToMessage('${targetId}')">
                <span class="reply-user">↩ ${username}:</span> 
                <span class="reply-text">${text}</span>
            </div>`;
}

function init() {
    console.log("[ChatReply] Inicializando sistema de respostas...");

    // Expõe funções globais para os onclicks (HTML) funcionarem
    window.replyToMessage = replyToId;
    window.scrollToMessage = scrollToMessage;

    const targetNode = document.getElementById("messagebuffer");
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (!node.classList.contains('chat-msg-')) continue;

                // 1. Adicionar Botão de Reply
                // Verifica se já não tem botão (para evitar duplicidade)
                if (!node.querySelector('.reply-btn')) {
                    const timestamp = node.querySelector('.timestamp');
                    if (timestamp) {
                        const btn = document.createElement('span');
                        btn.className = 'reply-btn pointer';
                        btn.innerHTML = ' ↩'; // Ícone de reply
                        btn.title = "Responder";
                        btn.style.cursor = "pointer";
                        btn.style.marginLeft = "5px";
                        btn.onclick = () => {
                            // Pega o ID gerado pelo módulo chatId.js
                            const id = node.getAttribute('data-msg-id');
                            if (id) replyToId(id);
                            else console.warn("[ChatReply] Mensagem sem ID ainda.");
                        };
                        // Insere logo após o timestamp
                        timestamp.parentNode.insertBefore(btn, timestamp.nextSibling);
                    }
                }

                // 2. Processar Mensagem se for uma Resposta
                const msgBody = node.innerHTML;
                const replyRegex = /\[r\](.*?)\[\/r\]/;
                const match = msgBody.match(replyRegex);

                if (match) {
                    const replyId = match[1];
                    const fullTag = match[0];

                    // Cria o cabeçalho visual
                    const headerHtml = createReplyHeader(replyId);

                    // Remove a tag [r]...[/r] do texto visível e insere o cabeçalho antes
                    // O CyTube geralmente bota o texto num span. Vamos tentar injetar dentro dele ou antes dele.
                    
                    // Estratégia segura: Substituir a tag por string vazia e dar Prepend no header
                    node.innerHTML = node.innerHTML.replace(fullTag, "");
                    
                    // Inserimos o preview logo após o timestamp/botões
                    const refElement = node.querySelector('.username') || node.querySelector('.timestamp');
                    if (refElement) {
                        // Cria um elemento container para o preview
                        const previewDiv = document.createElement("div");
                        previewDiv.innerHTML = headerHtml;
                        // Insere antes da mensagem de texto, mas quebrando linha
                        // No layout padrão do CyTube, o texto é inline. Vamos forçar um bloco.
                        node.insertBefore(previewDiv, refElement.nextSibling.nextSibling); 
                    }
                }
            }
        }
    });

    observer.observe(targetNode, { childList: true });
}

export default { init };
