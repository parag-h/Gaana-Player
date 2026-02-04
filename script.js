const API = "http://127.0.0.1:8000";
const audio = document.getElementById('audio');
let hls = new Hls();

async function doSearch() {
    const query = document.getElementById('q').value;
    const resultsDiv = document.getElementById('results');
    if(!query) return;

    resultsDiv.innerHTML = "<p>Searching...</p>";

    try {
        const response = await fetch(`${API}/songs/search/?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        resultsDiv.innerHTML = '';

        data.forEach(s => {
            const coverUrl = s.images.urls.small_artwork;
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <img src="${coverUrl}" class="album-art">
                <div class="song-details">
                    <strong>${s.title}</strong><br>
                    <small style="color:#888">${s.artists}</small>
                </div>
                <button type="button" class="play-btn" style="background:#2ecc71; margin-right:5px;">▶️ Play</button>
                <button type="button" class="dl-btn">⬇️ Save</button>
            `;
            
            div.querySelector('.play-btn').onclick = () => {
                updatePlayerUI(s.title, s.artists, coverUrl);
                playStream(s.stream_urls.urls.very_high_quality);
            };

            div.querySelector('.dl-btn').onclick = () => doDl(s.stream_urls.urls.very_high_quality, s.title, coverUrl);
            resultsDiv.appendChild(div);
        });
    } catch (err) {
        resultsDiv.innerHTML = "<p>Search Error. Is the backend running?</p>";
    }
}

async function doDl(url, title, artUrl) {
    alert("Downloading: " + title);
    try {
        await fetch(`${API}/download?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&art_url=${encodeURIComponent(artUrl)}`);
    } catch (err) {
        console.error("Download failed", err);
    }
}

async function getLib() {
    try {
        const res = await fetch(`${API}/library`);
        const libraryData = await res.json();
        const libDiv = document.getElementById('lib');
        libDiv.innerHTML = '';

        libraryData.forEach(item => {
            const div = document.createElement('div');
            div.className = 'item';
            const localArt = `${API}/offline/${encodeURIComponent(item.art)}`;
            
            div.innerHTML = `
                <img src="${localArt}" class="album-art" onerror="this.src='https://cdn-icons-png.flaticon.com/512/26/26230.png'">
                <div class="song-details"><strong>${item.filename}</strong></div>
                <button type="button" style="background:#2ecc71" onclick="playOff('${item.filename}', '${localArt}')">▶️ Play</button>
            `;
            libDiv.appendChild(div);
        });
    } catch (err) { console.error("Library load error", err); }
}

function updatePlayerUI(title, artist, art) {
    document.getElementById('p-bar').style.display = 'block';
    document.getElementById('playing-title').innerText = title;
    document.getElementById('playing-artist').innerText = artist;
    document.getElementById('current-art').src = art;
}

function playStream(url) {
    if(hls) hls.destroy();
    if (Hls.isSupported() && url.includes('.m3u8')) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, () => audio.play());
    } else {
        audio.src = url;
        audio.play();
    }
}

function playOff(fileName, artUrl) {
    updatePlayerUI(fileName, "Offline Library", artUrl);
    if(hls) {
        hls.destroy();
        hls = new Hls(); 
    }
    audio.src = `${API}/offline/${encodeURIComponent(fileName)}`;
    audio.load();
    audio.play();
}

window.onload = getLib;