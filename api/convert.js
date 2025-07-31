import { writeFile, readFile, unlink } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export const config = {
  api: {
    bodyParser: false, // Important for raw binary
  },
};

export default async function handler(req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    await writeFile('/tmp/input.pcm', buffer);

    // Convert to mp3 using ffmpeg
    await execAsync(`ffmpeg -f s16le -ar 24000 -ac 1 -i /tmp/input.pcm /tmp/output.mp3`);

    const mp3 = await readFile('/tmp/output.mp3');
    await unlink('/tmp/input.pcm');
    await unlink('/tmp/output.mp3');

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="output.mp3"');
    res.status(200).send(mp3);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to convert PCM to MP3' });
  }
}
