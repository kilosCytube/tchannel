// src/modules/imageUploader.js

// Lista de proxies em ordem de prioridade (igual ao driveMetadata)
const PROXY_LIST = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?url=',
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
        const proxy = PROXY_LIST[i];
        const url = proxy + encodeURIComponent(CATBOX_API);
        
        console.log(`[ImageUploader] Tentando upload via Proxy ${i+1}...`);

        try {
            const response = await fetch(url, {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                const text = await response.text();
                if (text.startsWith("http")) {
                    console.log(`[ImageUploader] Sucesso no Proxy ${i+1}`);
                    return text.trim();
                }
            }
        } catch (err) {
            console.warn(`[ImageUploader] Falha no Proxy ${i+1}:`, err);
        }
    }
    
    throw new Error("Falha no upload em todos os proxies.");
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
            alert(`Falha no upload: ${err.message}`);
        })
        .finally(() => {
            chatInput.disabled = false;
            chatInput.style.cursor = "text";
            chatInput.focus();
        });
}

function init() {
    console.log("[ImageUploader] Inicializando com Multi-Proxy...");
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
