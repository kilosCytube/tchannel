// src/main.js
import DriveSync from "./modules/driveSync.js";
import DriveMetadata from "./modules/driveMetadata.js";
import ChatCommands from "./modules/chatCommands.js";
import UITweaks from "./modules/uiTweaks.js";
import ImageUploader from "./modules/imageUploader.js";
import ChatEmbeds from "./modules/chatEmbeds.js";
import ChatId from "./modules/chatId.js"; // <--- Importando o módulo de IDs

window.TChannel = {
    init() {
        console.log("[TChannel] Inicializando sistema modular completo...");
        
        UITweaks.init();       // 1. Interface, Admin Hats, Textarea
        DriveMetadata.init();  // 2. API para "tocar" vídeos do Drive
        DriveSync.init();      // 3. Sincronização de Play/Pause
        ChatCommands.init();   // 4. Comandos (.roll, .clear)
        ImageUploader.init();  // 5. Upload Ctrl+V
        ChatEmbeds.init();     // 6. Visualização de Imagens
        ChatId.init();         // 7. Geração de IDs únicos nas mensagens
    }
};

$(document).ready(() => {
    window.TChannel.init();
});
