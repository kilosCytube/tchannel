// src/main.js
import DriveSync from "./modules/driveSync.js";
import DriveMetadata from "./modules/driveMetadata.js"; // <--- Novo
import ChatCommands from "./modules/chatCommands.js";
import UITweaks from "./modules/uiTweaks.js";
import ImageUploader from "./modules/imageUploader.js";
import ChatEmbeds from "./modules/chatEmbeds.js";

window.TChannel = {
    init() {
        console.log("[TChannel] Inicializando sistema modular completo...");
        
        UITweaks.init();       // Interface, Admin Hats, Textarea
        DriveMetadata.init();  // API para "tocar" vídeos do Drive
        DriveSync.init();      // Sincronização de Play/Pause
        ChatCommands.init();   // Comandos (.roll, .clear)
        ImageUploader.init();  // Upload Ctrl+V
        ChatEmbeds.init();     // Visualização de Imagens
    }
};

$(document).ready(() => {
    window.TChannel.init();
});
