// src/modules/uiTweaks.js

function makeChatMultiline() {
    try {
        var oldChatline = $("#chatline");
        // Verifica se já não é textarea para evitar duplicidade
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

            // --- Handler de Teclas ---
            newChatline.on('keydown', function(ev) {
                // [ENTER] Enviar Mensagem
                if (ev.keyCode === 13 && !ev.shiftKey) {
                    ev.preventDefault();
                    
                    var rawMsg = $(this).val();
                    if (rawMsg.trim() === "") return;

                    // Histórico Local
                    if (!window.CHATHIST) window.CHATHIST = [];
                    window.CHATHIST.push(rawMsg);
                    window.CHATHISTIDX = window.CHATHIST.length;

                    $(this).val("");
                    this.style.height = 'auto';

                    var linesToSend = rawMsg.split('\n');
                    
                    function sendNextLine() {
                        var msg = linesToSend.shift();
                        if (typeof msg === 'undefined') return;
                        
                        if (msg.trim() === "") {
                            sendNextLine();
                            return;
                        }

                        // --- LÓGICA DO /admn (NOVO) ---
                        var meta = {};
                        
                        if (msg.startsWith("/admn ")) {
                            // Remove o comando "/admn " do início (6 caracteres)
                            msg = msg.substring(6); 
                            
                            // Adiciona a classe CSS personalizada
                            meta.addClass = "tchannel-admin-msg";
                            
                            // (Opcional) Aplica o estilo também ao nome e hora
                            meta.addClassToNameAndTimestamp = true; 
                        }
                        // ------------------------------

                        window.socket.emit("chatMsg", { msg: msg, meta: meta });
                        
                        if (linesToSend.length > 0) {
                            setTimeout(sendNextLine, 150); 
                        }
                    }
                    
                    sendNextLine();
                }
                // [TAB] Autocompletar
                else if (ev.keyCode === 9) {
                    try { 
                        if (window.chatTabComplete) window.chatTabComplete(ev.target); 
                    } catch (e) { console.error(e); }
                    ev.preventDefault();
                    return false;
                }
                // [SETAS] Histórico
                else if (ev.keyCode === 38 && !ev.shiftKey) {
                    if (window.CHATHIST && window.CHATHISTIDX > 0) {
                        ev.preventDefault();
                        window.CHATHISTIDX--;
                        $(this).val(window.CHATHIST[window.CHATHISTIDX]);
                    }
                }
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
            
            console.log("[UITweaks] Chat Multilinha + Comando /admn ativados.");
        }
    } catch (e) {
        console.error("[UITweaks] Erro:", e);
    }
}

function init() {
    const brand = document.querySelector('.navbar-brand');
    if (brand) brand.textContent = 'Tchannel';
    makeChatMultiline();
}

export default { init };
