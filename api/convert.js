const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { writeFileSync, unlinkSync, readFileSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST supported');
  }

  try {
    const buffer = [];
    for await (const chunk of req) buffer.push(chunk);
    const pcmData = Buffer.concat(buffer);

    const inputPath = join(tmpdir(), `input-${Date.now()}.pcm`);
    const outputPath = join(tmpdir(), `output-${Date.now()}.mp3`);

    writeFileSync(inputPath, pcmData);

    ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .input(inputPath)
      .inputFormat('s16le')
      .audioFrequency(24000)
      .audioChannels(1)
      .on('end', () => {
        const mp3 = readFileSync(outputPath);
        unlinkSync(inputPath);
        unlinkSync(outputPath);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', 'inline; filename="output.mp3"');
        res.send(mp3);
      })
      .on('error', (err) => {
        console.error('ffmpeg error:', err);
        res.status(500).send('Conversion failed');
      })
      .save(outputPath);
  } catch (err) {
    console.error('handler error:', err);
    res.status(500).send('Unexpected error');
  }
};
