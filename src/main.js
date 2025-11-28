// src/main.js
import DriveSync from "./driveSync.js"; // O navegador resolve isso relativo ao arquivo main.js no CDN

window.TChannel = {
    init() {
        console.log("[TChannel] Inicializando módulos...");
        DriveSync.init();
    },
    // Opcional: Expor o módulo para depuração no console
    modules: {
        DriveSync
    }
};

// Inicia quando o DOM estiver pronto (compatível com jQuery do CyTube)
$(document).ready(() => {
    window.TChannel.init();
});
