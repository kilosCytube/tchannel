// src/main.js
import DriveSync from "./modules/driveSync.js";
import ChatCommands from "./modules/chatCommands.js"; // <--- NOVO IMPORT

window.TChannel = {
    init() {
        console.log("[TChannel] Inicializando módulos...");
        
        // Inicia o player do Drive
        DriveSync.init();
        
        // Inicia os comandos de chat
        ChatCommands.init();
    },
    modules: {
        DriveSync,
        ChatCommands // <--- Exposto para debug
    }
};

$(document).ready(() => {
    window.TChannel.init();
});