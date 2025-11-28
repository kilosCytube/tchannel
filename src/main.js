import DriveSync from "./driveSync.js";

window.TChannel = {
    init() {
        DriveSync.init();
    }
};

$(document).ready(() => TChannel.init());