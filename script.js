const API = "https://your-app-name.onrender.com"; // Replace with your Render URL
const audio = document.getElementById('audio');
let hls = new Hls();

async function doSearch() {
    const q = document.getElementById('q').value;
    const resDiv = document.getElementById('results');
    if(!q) return;
    resDiv.innerHTML = "Searching...";

    try {
        const res = await fetch(`${API}/songs/search/?query=${encodeURIComponent(q)}`);
        const data = await res.json();
        resDiv.innerHTML = '';

        data.forEach(s => {
            const art = s.images.urls.small_artwork;
            const url = s.stream_urls.urls.very_high_quality;
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `
                <img src="${art}" class="album-art">
                <div class="song-details"><strong>${s.title}</strong><br><small>${s.artists}</small></div>
                <button type="button" class="play-btn" style="background:#2ecc71">▶️</button>
                <button type="button" class="dl-btn">⬇️</button>
            `;
            
            div.querySelector('.play-btn').onclick = () => playS(url, s.title, s.artists, art);
            div.querySelector('.dl-btn').onclick = () => doDl(url, s.title, art);
            resDiv.appendChild(div);
        });
    } catch (e) { resDiv.innerHTML = "Error: Check API URL"; }
}

async function doDl(url, title, art) {
    alert("Download started!");
    await fetch(`${API}/download?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&art_url=${encodeURIComponent(art)}`);
}

function playS(url, t, a, img) {
    document.getElementById('p-bar').style.display = 'block';
    document.getElementById('p-title').innerText = t;
    document.getElementById('p-art').src = img;
    if(hls) hls.destroy();
    if(url.includes('.m3u8')) {
        hls = new Hls(); hls.loadSource(url); hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, () => audio.play());
    } else { audio.src = url; audio.play(); }
}
