// src/modules/chatEmbeds.js

function createImgHtml(url) {
    return `<div class="chat-embed-container" style="margin-top: 5px;">
                <a href="${url}" target="_blank">
                    <img src="${url}" class="chat-embed-image" style="max-width: 400px; max-height: 200px; border-radius: 4px; display: block;"/>
                </a>
            </div>`;
}

function init() {
    const targetNode = document.getElementById("messagebuffer");
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue; 

                // Procura o elemento que contém o texto da mensagem
                // No CyTube geralmente é um span dentro da div da mensagem
                // Mas vamos olhar o innerHTML da div inteira para garantir
                let msgHtml = node.innerHTML;

                // CORREÇÃO: Regex ajustada para pegar o link DENTRO da tag <a> gerada pelo CyTube
                // Procura por: .embed (espaço) <a href="(URL DA IMAGEM)" ...
                const embedRegex = /\.embed\s+<a\s+href="([^"]+)"[^>]*>.*?<\/a>/i;
                const match = msgHtml.match(embedRegex);

                if (match) {
                    // match[0] é todo o trecho ".embed <a ... </a>"
                    // match[1] é a URL limpa capturada no href
                    const fullMatch = match[0];
                    const url = match[1];

                    // Verifica se é imagem mesmo (segurança extra visual)
                    if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)/i)) {
                        // Substitui o comando e o link pelo HTML da imagem
                        node.innerHTML = node.innerHTML.replace(fullMatch, createImgHtml(url));
                        
                        // Marca como processado para evitar loops (embora o replace já resolva)
                        node.dataset.embedProcessed = "true";

                        // Rola o chat se necessário
                        const img = node.querySelector("img.chat-embed-image");
                        if (img && window.SCROLLCHAT) {
                            img.onload = () => window.scrollChat();
                        }
                    }
                }
            }
        }
    });

    observer.observe(targetNode, { childList: true, subtree: true });
    console.log("[ChatEmbeds] Observador de imagens corrigido iniciado.");
}

export default { init };
