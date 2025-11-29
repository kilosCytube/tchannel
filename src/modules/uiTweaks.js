// src/modules/uiTweaks.js

function makeChatMultiline() {
    try {
        var oldChatline = $("#chatline");
        if (oldChatline.length > 0 && oldChatline[0].tagName !== "TEXTAREA") {
            var newChatline = $("<textarea/>");
            
            // Copia atributos essenciais
            newChatline.attr({
                'id': oldChatline.attr('id'),
                'class': oldChatline.attr('class'),
                'placeholder': 'Envie uma mensagem (Shift+Enter para pular linha)',
                'maxlength': oldChatline.attr('maxlength'),
                'spellcheck': 'false',
                'rows': '1'
            });

            oldChatline.replaceWith(newChatline);

            // Auto-resize
            newChatline.on('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });

            // Lógica de Envio Sequencial
            newChatline.on('keydown', function(ev) {
                // Enter sem Shift envia
                if (ev.keyCode === 13 && !ev.shiftKey) {
                    ev.preventDefault();
                    
                    var rawMsg = $(this).val();
                    if (rawMsg.trim() === "") return;

                    // Histórico de chat (opcional, mas bom ter)
                    if (!window.CHATHIST) window.CHATHIST = [];
                    window.CHATHIST.push(rawMsg);
                    window.CHATHISTIDX = window.CHATHIST.length;

                    $(this).val("");
                    this.style.height = 'auto';

                    // CORREÇÃO: Divide por quebra de linha e envia um por um
                    var linesToSend = rawMsg.split('\n');
                    
                    function sendNextLine() {
                        var msg = linesToSend.shift();
                        if (typeof msg === 'undefined') return;
                        
                        // Pula linhas vazias
                        if (msg.trim() === "") {
                            sendNextLine();
                            return;
                        }

                        // Envia para o socket
                        window.socket.emit("chatMsg", { msg: msg });
                        
                        // Espera um pouco antes de enviar a próxima para não ser bloqueado por flood
                        if (linesToSend.length > 0) {
                            setTimeout(sendNextLine, 150); 
                        }
                    }
                    
                    sendNextLine();
                }
                // Seta para Cima (Histórico)
                else if (ev.keyCode === 38 && !ev.shiftKey) {
                    if (window.CHATHIST && window.CHATHISTIDX > 0) {
                        ev.preventDefault();
                        window.CHATHISTIDX--;
                        $(this).val(window.CHATHIST[window.CHATHISTIDX]);
                    }
                }
                // Seta para Baixo (Histórico)
                else if (ev.keyCode === 40 && !ev.shiftKey) {
                    if (window.CHATHIST && window.CHATHISTIDX < window.CHATHIST.length - 1) {
                        ev.preventDefault();
                        window.CHATHISTIDX++;
                        $(this).val(window.CHATHIST[window.CHATHISTIDX]);
                    } else {
                        window.CHATHISTIDX = window.CHATHIST.length;
                        $(this).val("");
                    }
                }
            });
            
            console.log("[UITweaks] Chat transformado em Textarea (Modo Sequencial).");
        }
    } catch (e) {
        console.error("[UITweaks] Erro ao modificar chat:", e);
    }
}

function init() {
    const brand = document.querySelector('.navbar-brand');
    if (brand) brand.textContent = 'Tchannel';
    makeChatMultiline();
}

export default { init };
