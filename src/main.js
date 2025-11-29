// src/main.js
import DriveSync from "./modules/driveSync.js";
import ChatCommands from "./modules/chatCommands.js";
import UITweaks from "./modules/uiTweaks.js";       // <--- Novo
import ImageUploader from "./modules/imageUploader.js"; // <--- Novo
import ChatEmbeds from "./modules/chatEmbeds.js";   // <--- Novo

window.TChannel = {
    init() {
        console.log("[TChannel] Inicializando sistema modular...");
        
        UITweaks.init();       // 1. Arruma a interface (textarea)
        DriveSync.init();      // 2. Sincroniza player
        ChatCommands.init();   // 3. Comandos de texto (.roll)
        ImageUploader.init();  // 4. Ctrl+V no chat
        ChatEmbeds.init();     // 5. Transforma .embed em <img>
    }
};

$(document).ready(() => {
    window.TChannel.init();
});
