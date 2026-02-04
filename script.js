const API = "https://gaana-player-parag.onrender.com";
const audio = document.getElementById('audio');
let hls = new Hls();

// --- SEARCH FUNCTION ---
async function doSearch() {
    const q = document.getElementById('q').value;
    const resDiv = document.getElementById('results');
    if (!q) return;
    
    resDiv.innerHTML = "Searching...";

    try {
        const res = await fetch(`${API}/songs/search/?query=${encodeURIComponent(q)}`);
        const data = await res.json();
        resDiv.innerHTML = '';

        data.forEach(s => {
            // Fix Mixed Content: Force HTTPS for art and streams
            const art = s.images.urls.small_artwork.replace("http://", "https://");
            const url = s.stream_urls.urls.very_high_quality.replace("http://", "https://");
            
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <img src="${art}" class="album-art" style="width:50px; border-radius:4px;">
                <div class="song-details" style="display:inline-block; vertical-align:top; margin-left:10px;">
                    <strong>${s.title}</strong><br>
                    <small>${s.artists}</small>
                </div>
                <div style="margin-top:5px;">
                    <button type="button" class="play-btn" style="background:#2ecc71; color:white; border:none; padding:5px 10px; cursor:pointer;">▶️ Play</button>
                    <button type="button" class="dl-btn" style="background:#3498db; color:white; border:none; padding:5px 10px; cursor:pointer;">⬇️ Download</button>
                </div>
                <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
            `;
            
            div.querySelector('.play-btn').onclick = () => playS(url, s.title, s.artists, art);
            div.querySelector('.dl-btn').onclick = () => doDl(url, s.title, art);
            resDiv.appendChild(div);
        });
    } catch (e) { 
        resDiv.innerHTML = "Error: Check your connection or Render logs."; 
        console.error("Search error:", e);
    }
}

// --- PLAYBACK FUNCTION ---
function playS(url, t, a, img) {
    const secureUrl = url.replace("http://", "https://");
    const secureImg = img.replace("http://", "https://");

    // Update Player UI - Matching your HTML IDs
    const barEl = document.getElementById('p-bar');
    const titleEl = document.getElementById('playing-title');
    const artistEl = document.getElementById('playing-artist');
    const artEl = document.getElementById('current-art');

    if (barEl) barEl.style.display = 'block';
    if (titleEl) titleEl.innerText = t;
    if (artistEl) artistEl.innerText = a;
    if (artEl) artEl.src = secureImg;
    
    // Clean up previous stream
    if (hls) hls.destroy();

    // Handle M3U8 (HLS) Streams
    if (secureUrl.includes('.m3u8')) {
        if (Hls.isSupported()) {
            hls = new Hls(); 
            hls.loadSource(secureUrl); 
            hls.attachMedia(audio);
            hls.on(Hls.Events.MANIFEST_PARSED, () => audio.play());
        } 
        else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
            // Support for Safari/iOS
            audio.src = secureUrl;
            audio.play();
        }
    } else { 
        // Handle direct MP3/AAC streams
        audio.src = secureUrl; 
        audio.play(); 
    }
}

// --- DOWNLOAD FUNCTION ---
async function doDl(url, title, art) {
    alert("Download request sent! Check your library folder shortly.");
    try {
        const secureUrl = url.replace("http://", "https://");
        const secureArt = art.replace("http://", "https://");
        
        await fetch(`${API}/download?url=${encodeURIComponent(secureUrl)}&title=${encodeURIComponent(title)}&art_url=${encodeURIComponent(secureArt)}`);
    } catch (e) {
        console.error("Download failed to trigger:", e);
    }
}

// --- LIBRARY FUNCTION ---
async function getLib() {
    const libDiv = document.getElementById('lib');
    libDiv.innerHTML = "Loading library...";
    try {
        const res = await fetch(`${API}/library`);
        const data = await res.json();
        libDiv.innerHTML = '';

        if (data.length === 0) {
            libDiv.innerHTML = "No downloaded songs yet.";
            return;
        }

        data.forEach(item => {
            const div = document.createElement('div');
            div.style.margin = "10px 0";
            div.innerHTML = `
                <strong>${item.filename}</strong><br>
                <audio src="${API}/offline/${item.filename}" controls style="height:30px;"></audio>
            `;
            libDiv.appendChild(div);
        });
    } catch (e) {
        libDiv.innerHTML = "Failed to load library.";
    }
}
