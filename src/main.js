// src/main.js
import DriveSync from "./modules/driveSync.js";
import DriveMetadata from "./modules/driveMetadata.js";
import ChatCommands from "./modules/chatCommands.js";
import UITweaks from "./modules/uiTweaks.js";
import ImageUploader from "./modules/imageUploader.js";
import ChatEmbeds from "./modules/chatEmbeds.js";
import ChatId from "./modules/chatId.js"; 
import ChatReply from "./modules/chatReply.js"; // <--- Novo

window.TChannel = {
    init() {
        console.log("[TChannel] Inicializando sistema modular completo...");
        
        // Ordem sugerida para evitar conflitos de DOM:     
        UITweaks.init();       
        //DriveMetadata.init();  
        // DriveSync.init(); // Desativado: Iframe não aceita conexões externas
        ChatCommands.init();
        ImageUploader.init();  
        ChatId.init();         // Gera IDs (Importante vir antes do Reply)
        ChatReply.init();      // Usa os IDs para criar botões
        ChatEmbeds.init();     
    }
};

$(document).ready(() => {
    window.TChannel.init();
});

