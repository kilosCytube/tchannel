// src/modules/driveMetadata.js
// Responsável por buscar metadados e links diretos do Google Drive para o player do CyTube

const CORS_PROXY = 'https://corsproxy.io/?url=';
const ITAG_QMAP = { 37: 1080, 46: 1080, 22: 720, 45: 720, 59: 480, 44: 480, 35: 480, 18: 360, 43: 360, 34: 360 };
const ITAG_CMAP = { 43: 'video/webm', 44: 'video/webm', 45: 'video/webm', 46: 'video/webm', 18: 'video/mp4', 22: 'video/mp4', 37: 'video/mp4', 59: 'video/mp4', 35: 'video/flv', 34: 'video/flv' };

function mapLinks(links) {
    var videos = { 1080: [], 720: [], 480: [], 360: [] };
    Object.keys(links).forEach(function (itag) {
        itag = parseInt(itag, 10);
        if (!ITAG_QMAP.hasOwnProperty(itag)) return;
        videos[ITAG_QMAP[itag]].push({
            itag: itag,
            contentType: ITAG_CMAP[itag],
            link: links[itag]
        });
    });
    return videos;
}

function getVideoInfo(id, cb) {
    var googleUrl = 'https://docs.google.com/get_video_info?authuser=&docid=' + id + '&sle=true&hl=en';
    var url = CORS_PROXY + encodeURIComponent(googleUrl);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
        try {
            if (xhr.status !== 200) return cb('Google Drive request failed: HTTP ' + xhr.status);

            var data = {};
            xhr.responseText.split('&').forEach(function (kv) {
                var pair = kv.split('=');
                data[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            });

            if (data.status === 'fail') {
                return cb('Google Drive Error: ' + unescape(data.reason).replace(/\+/g, ' '));
            }
            if (!data.fmt_stream_map) {
                return cb('Google has removed the video streams associated with this item.');
            }

            data.links = {};
            data.fmt_stream_map.split(',').forEach(function (item) {
                var pair = item.split('|');
                data.links[pair[0]] = pair[1];
            });
            data.videoMap = mapLinks(data.links);

            cb(null, data);
        } catch (error) {
            console.error("[DriveMetadata] Parse Error:", error);
        }
    };
    xhr.onerror = function () {
        cb('Google Drive HTTP request failed');
    };
    xhr.send();
}

function init() {
    // Expõe a função globalmente para o CyTube usá-la
    window.getGoogleDriveMetadata = getVideoInfo;
    window.hasDriveUserscript = true; // Avisa ao CyTube que temos um script customizado
    window.driveUserscriptVersion = '1.7';
    console.log('[DriveMetadata] Player customizado do Google Drive registrado.');
}

export default { init };
