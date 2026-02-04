import os
import subprocess
import asyncio
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.gaanapy import GaanaPy

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.gaanapy = GaanaPy()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OFFLINE_DIR = "offline_music"
if not os.path.exists(OFFLINE_DIR):
    os.makedirs(OFFLINE_DIR)

# This MOUNT is what allows the browser to see the files
app.mount("/offline", StaticFiles(directory=OFFLINE_DIR), name="offline")

async def download_image(image_url: str, image_path: str):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(image_url)
            if response.status_code == 200:
                with open(image_path, "wb") as f:
                    f.write(response.content)
                print(f"🖼️ Album Art Saved: {image_path}")
    except Exception as e:
        print(f"❌ Image Download Failed: {e}")

def run_ffmpeg_task(url: str, file_path: str):
    # This points to the exact location where your .sh script saves ffmpeg
    ffmpeg_exe = os.path.join(os.getcwd(), "ffmpeg_bin", "ffmpeg")
    
    command = [
        ffmpeg_exe, "-y", "-user_agent", 
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36",
        "-i", url, "-c:a", "libmp3lame", "-q:a", "2", file_path
    ]
    
    # YOU NEED THIS PART:
    try:
        subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        print(f"✅ Audio Download Finished: {file_path}")
    except Exception as e:
        print(f"❌ FFmpeg Failed: {e}")

@app.get("/songs/search/")
async def search(query: str):
    # Pass arguments positionally: first is query, second is limit
    return await app.state.gaanapy.search_songs(query, 10)

@app.get("/download")
async def download(url: str, title: str, art_url: str, tasks: BackgroundTasks):
    # Sanitize title: remove dots and special chars that mess up extensions
    clean_title = "".join([c for c in title if c.isalnum() or c in (' ', '_')]).strip()
    
    audio_path = os.path.join(OFFLINE_DIR, f"{clean_title}.mp3")
    image_path = os.path.join(OFFLINE_DIR, f"{clean_title}.jpg")
    
    tasks.add_task(run_ffmpeg_task, url, audio_path)
    tasks.add_task(download_image, art_url, image_path)
    
    return {"message": "Started", "file": clean_title}

@app.get("/library")
async def library():
    files = [f for f in os.listdir(OFFLINE_DIR) if f.endswith(".mp3")]
    library_data = []
    for f in files:
        base_name = f.rsplit('.', 1)[0]
        # Check if jpg exists for this specific mp3
        img_name = f"{base_name}.jpg"
        has_art = os.path.exists(os.path.join(OFFLINE_DIR, img_name))
        
        library_data.append({
            "filename": f,
            "art": img_name if has_art else "default.jpg"
        })
    return library_data

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
from fastapi.responses import FileResponse

@app.get("/")
async def read_index():
    return FileResponse('index.html')




