#!/usr/bin/env bash
# Full pipeline: frames -> video parts (parallel) -> score/SFX/ducked mix -> loudness master -> final MP4
# usage: ./build.sh <voiceover audio file>
set -euo pipefail
cd "$(dirname "$0")"; VO="$1"; mkdir -p out
FRAMES=3729; P=4; STEP=$(( (FRAMES + P - 1) / P ))
if [ "${SKIP_RENDER:-0}" != 1 ]; then
  for i in $(seq 0 $((P-1))); do s=$((i*STEP)); e=$(( s+STEP > FRAMES ? FRAMES : s+STEP )); node render.js chunk $s $e out/part$i.mp4 > out/log$i.txt 2>&1 & done; wait
fi
ffmpeg -y -loglevel error -i "$VO" -ac 1 -ar 48000 out/vo48.wav
[ -f out/mix.wav ] && [ "${SKIP_AUDIO:-0}" = 1 ] || python3 audio.py out/vo48.wav out/mix.wav
# two-pass EBU R128 loudness normalisation to -14 LUFS / -1.5 dBTP (Instagram)
J=$(ffmpeg -hide_banner -i out/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -loglevel error -i out/mix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a pcm_s16le out/master.wav
( for i in $(seq 0 $((P-1))); do ffmpeg -loglevel error -i out/part$i.mp4 -f rawvideo -pix_fmt yuv420p -; done ) | ffmpeg -y -loglevel error -f rawvideo -pix_fmt yuv420p -s 1080x1920 -framerate 30 -i - -c:v libx264 -preset slow -crf 18 -maxrate 24M -bufsize 48M -profile:v high -level 4.2 -pix_fmt yuv420p out/video.mp4
ffmpeg -y -loglevel error -i out/video.mp4 -i out/master.wav -map 0:v -map 1:a -c:v copy -aspect 9:16 -c:a aac -b:a 320k -ar 48000 -movflags +faststart out/TheBigBreakdown_EP01_SpaceX.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of compact out/TheBigBreakdown_EP01_SpaceX.mp4
