#!/usr/bin/env bash
# exit on error
set -o errexit

# Install python dependencies
pip install -r requirements.txt

# Create a folder for ffmpeg and download the static binary
mkdir -p ffmpeg_bin
cd ffmpeg_bin
if [ ! -f ffmpeg ]; then
    wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
    tar xvf ffmpeg-release-amd64-static.tar.xz --strip-components=1
fi
cd ..