// src/modules/uiTweaks.js

function makeChatMultiline() {
    try {
        var oldChatline = $("#chatline");
        if (oldChatline.length > 0 && oldChatline[0].tagName !== "TEXTAREA") {
            var newChatline = $("<textarea/>");
            
            newChatline.attr({
                'id': oldChatline.attr('id'),
                'class': oldChatline.attr('class'),
                'placeholder': 'Envie uma mensagem (Shift+Enter para pular linha)',
                'maxlength': oldChatline.attr('maxlength'),
                'spellcheck': 'false',
                'rows': '1'
            });

            oldChatline.replaceWith(newChatline);

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
                        if (msg.trim() === "") { sendNextLine(); return; }

                        // --- LÓGICA DE ADMIN / MOD (O que faltava) ---
                        var meta = {};
                        
                        // Admin Hat (/a automático)
                        if (window.USEROPTS.adminhat && window.CLIENT.rank >= 255) {
                            msg = "/a " + msg;
                        }
                        // Mod Flair (Estrelinha)
                        else if (window.USEROPTS.modhat && window.CLIENT.rank >= window.Rank.Moderator) {
                            meta.modflair = window.CLIENT.rank;
                        }

                        // Mensagem de Mod (/m)
                        if (window.CLIENT.rank >= 2 && msg.indexOf("/m ") === 0) {
                            meta.modflair = window.CLIENT.rank;
                            msg = msg.substring(3);
                        }
                        // ----------------------------------------------

                        window.socket.emit("chatMsg", { msg: msg, meta: meta });
                        
                        if (linesToSend.length > 0) setTimeout(sendNextLine, 150); 
                    }
                    
                    sendNextLine();
                }
                // [TAB] Autocompletar Nomes (O que faltava)
                else if (ev.keyCode === 9) {
                    try { 
                        if (window.chatTabComplete) window.chatTabComplete(ev.target); 
                    } catch (e) { console.error(e); }
                    ev.preventDefault();
                    return false;
                }
                // [SETA CIMA] Histórico Anterior
                else if (ev.keyCode === 38 && !ev.shiftKey) {
                    if (window.CHATHIST && window.CHATHISTIDX > 0) {
                        ev.preventDefault();
                        window.CHATHISTIDX--;
                        $(this).val(window.CHATHIST[window.CHATHISTIDX]);
                    }
                }
                // [SETA BAIXO] Histórico Próximo
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
            
            console.log("[UITweaks] Chat Multilinha + Admin Tools ativados.");
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
