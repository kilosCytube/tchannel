// src/modules/uiTweaks.js

function makeChatMultiline() {
    try {
        var oldChatline = $("#chatline");
        if (oldChatline.length > 0 && oldChatline[0].tagName !== "TEXTAREA") {
            var newChatline = $("<textarea/>");
            
            // Copia atributos
            newChatline.attr({
                'id': oldChatline.attr('id'),
                'class': oldChatline.attr('class'),
                'placeholder': 'Envie uma mensagem (Shift+Enter para pular linha)',
                'maxlength': oldChatline.attr('maxlength'),
                'spellcheck': 'false',
                'rows': '1'
            });

            oldChatline.replaceWith(newChatline);

            // Lógica de resize e envio com Enter (simplificada do seu código original)
            newChatline.on('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });

            newChatline.on('keydown', function(ev) {
                if (ev.keyCode === 13 && !ev.shiftKey) {
                    ev.preventDefault();
                    const msg = $(this).val();
                    if (msg.trim()) {
                        // Envia para o socket do CyTube
                        window.socket.emit("chatMsg", { msg: msg });
                        // Adiciona ao histórico (opcional, simplificado aqui)
                    }
                    $(this).val("");
                    this.style.height = 'auto';
                }
            });
            
            console.log("[UITweaks] Chat transformado em Textarea.");
        }
    } catch (e) {
        console.error("[UITweaks] Erro ao modificar chat:", e);
    }
}

function init() {
    // Muda o título
    const brand = document.querySelector('.navbar-brand');
    if (brand) brand.textContent = 'Tchannel';

    // Transforma o chat
    makeChatMultiline();
}
export default { init };
