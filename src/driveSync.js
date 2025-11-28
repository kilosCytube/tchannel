// driveSync.js
// Módulo responsável por monitorar o player do Google Drive e sincronizar eventos com o CyTube

const DriveSync = (() => {

    const state = {
        initialized: false,
        player: null,
        syncing: false,
        lastTime: 0,
        apiReady: false,
    };

    /** ---------------------------
     *  Inicialização
     * -------------------------- */
    function init() {
        if (state.initialized) return;
        state.initialized = true;

        waitForDrivePlayer()
            .then(player => {
                state.player = player;
                attachDriveEvents();
                console.log("[DriveSync] Player encontrado e eventos anexados.");
            })
            .catch(err => console.error("[DriveSync] Falha:", err));
    }

    /** ---------------------------
     *  Detecção do iframe do Drive
     * -------------------------- */
    function waitForDrivePlayer() {
        return new Promise((resolve, reject) => {
            const timer = setInterval(() => {
                const iframe = document.querySelector("iframe[src*='google.com/file']");
                if (!iframe) return;

                try {
                    const player = iframe.contentWindow;
                    clearInterval(timer);
                    resolve(player);
                } catch {
                    clearInterval(timer);
                    reject("O iframe do Google Drive bloqueou acesso cross-origin.");
                }
            }, 500);
        });
    }

    /** ---------------------------
     *  Eventos do player
     * -------------------------- */
    function attachDriveEvents() {
        if (!state.player) return;

        window.addEventListener("message", handleDriveMessage);
        
        sendCommand({ event: "getState" });
        sendCommand({ event: "getCurrentTime" });
        sendCommand({ event: "getDuration" });
    }

    /** ---------------------------
     *  Comunicação com iframe
     * -------------------------- */
    function sendCommand(command) {
        try {
            state.player.postMessage(JSON.stringify(command), "*");
        } catch (e) {
            console.warn("[DriveSync] Falha ao enviar comando:", command, e);
        }
    }

    /** ---------------------------
     *  Receber mensagens do Drive
     * -------------------------- */
    function handleDriveMessage(event) {
        if (!event?.data) return;

        let data;
        try {
            data = JSON.parse(event.data);
        } catch {
            return;
        }

        if (data.event === "timeupdate") {
            state.lastTime = data.currentTime;
            emitSync("time", data.currentTime);
        }

        if (data.event === "play") emitSync("play");
        if (data.event === "pause") emitSync("pause");
    }

    /** ---------------------------
     *  Enviar eventos ao CyTube
     * -------------------------- */
    function emitSync(type, value = null) {
        if (typeof window.DriveSyncBus === "function") {
            window.DriveSyncBus({ type, value });
        }
    }

    /** ---------------------------
     *  Sincronizar comandos vindos do CyTube
     * -------------------------- */
    function onExternalCommand(cmd) {
        if (!state.player) return;

        if (cmd.type === "seek") {
            sendCommand({ event: "seekTo", seconds: cmd.value });
        }

        if (cmd.type === "pause") {
            sendCommand({ event: "pauseVideo" });
        }

        if (cmd.type === "play") {
            sendCommand({ event: "playVideo" });
        }
    }

    return { init, onExternalCommand };
})();