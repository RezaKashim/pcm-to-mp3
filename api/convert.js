import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Only POST supported', { status: 405 });
  }

  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();

  const buffer = await req.arrayBuffer();
  ffmpeg.FS('writeFile', 'input.pcm', new Uint8Array(buffer));

  await ffmpeg.run(
    '-f', 's16le',
    '-ar', '24000',
    '-ac', '1',
    '-i', 'input.pcm',
    'output.mp3'
  );

  const mp3Data = ffmpeg.FS('readFile', 'output.mp3');

  return new Response(mp3Data.buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="output.mp3"'
    }
  });
}
