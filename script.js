const API = "https://gaana-player-parag.onrender.com";
const audio = document.getElementById('audio');
let hls = new Hls();

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
            // Force HTTPS for images and stream URLs to prevent browser blocking
            const art = s.images.urls.small_artwork.replace("http://", "https://");
            const url = s.stream_urls.urls.very_high_quality.replace("http://", "https://");
            
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <img src="${art}" class="album-art">
                <div class="song-details">
                    <strong>${s.title}</strong><br>
                    <small>${s.artists}</small>
                </div>
                <div class="controls">
                    <button type="button" class="play-btn" style="background:#2ecc71">▶️</button>
                    <button type="button" class="dl-btn">⬇️</button>
                </div>
            `;
            
            div.querySelector('.play-btn').onclick = () => playS(url, s.title, s.artists, art);
            div.querySelector('.dl-btn').onclick = () => doDl(url, s.title, art);
            resDiv.appendChild(div);
        });
    } catch (e) { 
        resDiv.innerHTML = "Error: Check API URL or Network Connection"; 
        console.error("Search failed:", e);
    }
}

async function doDl(url, title, art) {
    alert("Download started! The song will appear in your library shortly.");
    try {
        // Ensure URLs sent to the backend are also sanitized
        const secureUrl = url.replace("http://", "https://");
        const secureArt = art.replace("http://", "https://");
        
        await fetch(`${API}/download?url=${encodeURIComponent(secureUrl)}&title=${encodeURIComponent(title)}&art_url=${encodeURIComponent(secureArt)}`);
    } catch (e) {
        console.error("Download trigger failed:", e);
    }
}

function playS(url, t, a, img) {
    // Force HTTPS for the player
    const secureUrl = url.replace("http://", "https://");
    const secureImg = img.replace("http://", "https://");

    document.getElementById('p-bar').style.display = 'block';
    document.getElementById('p-title').innerText = t;
    document.getElementById('p-art').src = secureImg;
    
    if (hls) {
        hls.destroy();
    }

    if (secureUrl.includes('.m3u8')) {
        if (Hls.isSupported()) {
            hls = new Hls(); 
            hls.loadSource(secureUrl); 
            hls.attachMedia(audio);
            hls.on(Hls.Events.MANIFEST_PARSED, () => audio.play());
        } 
        // For Safari/iOS which has native HLS support
        else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
            audio.src = secureUrl;
            audio.addEventListener('loadedmetadata', () => audio.play());
        }
    } else { 
        audio.src = secureUrl; 
        audio.play(); 
    }
}
