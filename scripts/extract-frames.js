const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VIDEO_PATH = process.argv[2] || './video.mp4';
const OUTPUT_DIR = './frontend/public/frames';

if (!fs.existsSync(VIDEO_PATH)) {
  console.error('❌ Video no encontrado:', VIDEO_PATH);
  console.log('Usage: node extract-frames.js <path-to-video>');
  process.exit(1);
}

console.log('🔍 Obteniendo info del video...');

const probeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames,r_frame_rate -of json "${VIDEO_PATH}"`;
const probeOutput = JSON.parse(execSync(probeCmd, { encoding: 'utf-8' }));

const stream = probeOutput.streams[0];
const width = stream.width;
const height = stream.height;
const frameRate = eval(stream.r_frame_rate);
const totalFrames = parseInt(stream.nb_frames) || Math.ceil(frameRate * 10);

console.log(`📹 Video: ${width}x${height} @ ${frameRate}fps, ${totalFrames} frames`);

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎬 Extrayendo frames...');

const cmd = `ffmpeg -i "${VIDEO_PATH}" -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2" -q:v 1 -vcodec libwebp -frames:v ${totalFrames} "${OUTPUT_DIR}/frame_%04d.webp"`;

execSync(cmd, { stdio: 'inherit' });

const extractedFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webp')).length;
console.log(`✅ Listo! ${extractedFiles} frames extraídos en ${OUTPUT_DIR}/`);
console.log(`\n📝 Usa estos valores en el componente:`);
console.log(`   totalFrames: ${extractedFiles}`);
console.log(`   width: ${width}`);
console.log(`   height: ${height}`);