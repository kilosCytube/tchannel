// src/modules/imageUploader.js

const CORS_PROXY = "https://corsproxy.io/?";
const CATBOX_API = "https://catbox.moe/user/api.php";

async function uploadToCatbox(file) {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("userhash", ""); // Opcional: Se quiser usar conta do Catbox
    formData.append("fileToUpload", file);

    try {
        const response = await fetch(CORS_PROXY + CATBOX_API, {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        const url = await response.text();
        if (!url.startsWith("http")) throw new Error("Resposta inválida do Catbox");
        
        return url.trim();
    } catch (err) {
        console.error("[ImageUploader] Falha no upload:", err);
        throw err;
    }
}

function handlePaste(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let file = null;

    // Procura por arquivo de imagem no clipboard
    for (let item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
            file = item.getAsFile();
            break;
        }
    }

    if (!file) return; // Se não for imagem, deixa o comportamento padrão (colar texto)

    e.preventDefault(); // Impede de colar o binário estranho no chat
    
    const chatInput = e.target;
    const originalText = chatInput.value;
    
    // Feedback visual
    chatInput.value = `[⏳ Uploading ${file.name}...]`;
    chatInput.disabled = true;
    chatInput.style.cursor = "wait";

    uploadToCatbox(file)
        .then(url => {
            // Sucesso: Substitui pelo comando .embed
            // Se já tinha texto antes, mantém e adiciona o embed no final
            const prefix = originalText ? originalText + " " : "";
            chatInput.value = `${prefix}.embed ${url}`;
        })
        .catch(err => {
            // Erro: Restaura o texto original e avisa
            chatInput.value = originalText;
            alert(`Falha no upload: ${err.message}`);
        })
        .finally(() => {
            // Restaura a interface
            chatInput.disabled = false;
            chatInput.style.cursor = "text";
            chatInput.focus();
        });
}

function init() {
    console.log("[ImageUploader] Inicializando...");
    
    // Tenta encontrar o chatline. Como o outro script pode transformar em textarea,
    // usamos um setInterval curto para garantir que pegamos o elemento final.
    const interval = setInterval(() => {
        const chatLine = document.getElementById("chatline");
        if (chatLine) {
            // Remove listeners antigos para evitar duplicidade (se houver reload)
            chatLine.removeEventListener("paste", handlePaste);
            chatLine.addEventListener("paste", handlePaste);
            
            console.log("[ImageUploader] Listener anexado ao #chatline");
            clearInterval(interval);
        }
    }, 1000);
}

export default { init };
