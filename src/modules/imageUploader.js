// src/modules/imageUploader.js

// LISTA DE PROXIES PARA UPLOAD (Apenas os que suportam POST)
// Nota: AllOrigins foi removido pois não suporta envio de arquivos.
const PROXY_LIST = [
    // CorsProxy.io: Geralmente aceita POST. Note o "?" no final.
    'https://corsproxy.io/?',
    // ThingProxy: Backup, mas pode ser lento para imagens grandes.
    'https://thingproxy.freeboard.io/fetch/'
];

const CATBOX_API = "https://catbox.moe/user/api.php";

async function uploadToCatbox(file) {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("userhash", ""); 
    formData.append("fileToUpload", file);

    // Tenta proxies sequencialmente
    for (let i = 0; i < PROXY_LIST.length; i++) {
        // Correção de URL: Alguns proxies não usam 'url=', apenas o link direto
        const proxyBase = PROXY_LIST[i];
        // Se o proxy for o corsproxy.io, ele pede a URL completa logo após o ?
        // Se for thingproxy, ele geralmente aceita a URL normal
        const targetUrl = proxyBase + encodeURIComponent(CATBOX_API);
        
        console.log(`[ImageUploader] Tentando upload via Proxy ${i+1} (${proxyBase})...`);

        try {
            const response = await fetch(targetUrl, {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                const text = await response.text();
                // O Catbox retorna apenas a URL em texto plano (ex: https://files.catbox.moe/xyz.png)
                if (text.startsWith("http")) {
                    console.log(`[ImageUploader] Sucesso no Proxy ${i+1}`);
                    return text.trim();
                } else {
                    console.warn(`[ImageUploader] Proxy ${i+1} retornou erro da API:`, text);
                }
            } else {
                console.warn(`[ImageUploader] Proxy ${i+1} falhou com status: ${response.status}`);
            }
        } catch (err) {
            console.warn(`[ImageUploader] Erro de rede no Proxy ${i+1}:`, err);
        }
    }
    
    throw new Error("Não foi possível conectar a nenhum proxy de upload. Tente uma imagem menor ou aguarde.");
}

function handlePaste(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let file = null;

    for (let item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
            file = item.getAsFile();
            break;
        }
    }

    if (!file) return; 

    e.preventDefault(); 
    
    const chatInput = e.target;
    const originalText = chatInput.value;
    
    // Feedback visual
    chatInput.value = `[⏳ Uploading ${file.name}...]`;
    chatInput.disabled = true;
    chatInput.style.cursor = "wait";

    uploadToCatbox(file)
        .then(url => {
            const prefix = originalText ? originalText + " " : "";
            chatInput.value = `${prefix}.embed ${url}`;
        })
        .catch(err => {
            chatInput.value = originalText;
            alert(`Falha: ${err.message}`);
        })
        .finally(() => {
            chatInput.disabled = false;
            chatInput.style.cursor = "text";
            chatInput.focus();
        });
}

function init() {
    console.log("[ImageUploader] Inicializando (Modo POST)...");
    const interval = setInterval(() => {
        const chatLine = document.getElementById("chatline");
        if (chatLine) {
            chatLine.removeEventListener("paste", handlePaste);
            chatLine.addEventListener("paste", handlePaste);
            clearInterval(interval);
        }
    }, 1000);
}

export default { init };
