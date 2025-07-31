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
    console.log('[convert] Input PCM written:', inputPath);

    const command = ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .input(inputPath)
      .inputFormat('s16le') // PCM signed 16-bit little-endian
      .audioFrequency(24000)
      .audioChannels(1)
      .audioCodec('libmp3lame')
      .outputOptions('-ar', '24000')
      .on('start', cmd => console.log('[ffmpeg] Started:', cmd))
      .on('stderr', line => console.log('[ffmpeg] STDERR:', line))
      .on('error', (err, stdout, stderr) => {
        console.error('[ffmpeg] ERROR:', err.message);
        console.error('[ffmpeg] STDOUT:', stdout);
        console.error('[ffmpeg] STDERR:', stderr);
        res.status(500).send('ffmpeg failed: ' + err.message);
      })
      .on('end', () => {
        console.log('[ffmpeg] Conversion completed.');
        const mp3 = fs.readFileSync(outputPath);
        console.log('[convert] Output MP3 size:', mp3.length);

        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', 'inline; filename="output.mp3"');
        res.send(mp3);
      });

    command.save(outputPath);
  } catch (err) {
    console.error('[convert] Unexpected error:', err);
    res.status(500).send('Unexpected server error');
  }
};
