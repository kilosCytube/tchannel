// src/modules/chatEmbeds.js

function createImgHtml(url) {
    return `<a href="${url}" target="_blank">
                <img src="${url}" class="chat-embed-image" style="max-width: 400px; max-height: 200px; border-radius: 4px; display: block; margin-top: 5px;"/>
            </a>`;
}

function init() {
    const targetNode = document.getElementById("messagebuffer");
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue; // Apenas elementos HTML
                
                // O CyTube coloca o texto da mensagem dentro de um span, geralmente o segundo filho
                // Estrutura: <div><span>Timestamp</span> <span>Nome</span> <span>MENSAGEM</span></div>
                // Mas sua regex original buscava no HTML, vamos manter a lógica de busca
                
                const msgBody = node.innerHTML;
                
                // Regex para encontrar ".embed <link>"
                // Aceita http/https e formatos de imagem comuns
                const embedRegex = /\.embed\s+(https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp))/i;
                const match = msgBody.match(embedRegex);

                if (match) {
                    const fullMatch = match[0];
                    const url = match[1];
                    
                    // Substitui o texto ".embed link" pela tag <img>
                    node.innerHTML = node.innerHTML.replace(fullMatch, createImgHtml(url));
                    
                    // Rola o chat pra baixo quando a imagem carregar
                    const img = node.querySelector("img.chat-embed-image");
                    if (img && window.SCROLLCHAT) {
                        img.onload = () => window.scrollChat();
                    }
                }
            }
        }
    });

    observer.observe(targetNode, { childList: true });
    console.log("[ChatEmbeds] Observador de imagens iniciado.");
}

export default { init };
