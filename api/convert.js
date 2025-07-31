const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST supported');
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const inputPath = join(tmpdir(), `input-${Date.now()}.pcm`);
    const outputPath = join(tmpdir(), `output-${Date.now()}.mp3`);

    fs.writeFileSync(inputPath, buffer);

    console.log('[convert] Running ffmpeg...');
    ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .input(inputPath)
      .inputFormat('s16le')
      .audioFrequency(24000)
      .audioChannels(1)
      .audioCodec('libmp3lame')
      .outputOptions('-ar', '24000') // Set output sample rate too
      .on('start', (cmd) => console.log('[ffmpeg] Start:', cmd))
      .on('stderr', (line) => console.log('[ffmpeg] stderr:', line))
      .on('error', (err) => {
        console.error('[ffmpeg] Error:', err);
        res.status(500).send('Conversion failed');
      })
      .on('end', () => {
        console.log('[ffmpeg] Done.');
        const mp3 = fs.readFileSync(outputPath);
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', 'inline; filename="output.mp3"');
        res.send(mp3);
      })
      .save(outputPath);
  } catch (err) {
    console.error('[convert] Handler error:', err);
    res.status(500).send('Unexpected error');
  }
};
