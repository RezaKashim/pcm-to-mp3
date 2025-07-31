import { writeFile, readFile, unlink } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default async function handler(req, res) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const inputPath = "/tmp/input.pcm";
  const outputPath = "/tmp/output.mp3";

  try {
    await writeFile(inputPath, buffer);
    await execAsync(`ffmpeg -f s16le -ar 24000 -ac 1 -i ${inputPath} ${outputPath}`);
    const mp3 = await readFile(outputPath);
    await unlink(inputPath);
    await unlink(outputPath);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "attachment; filename=\"output.mp3\"");
    res.send(mp3);
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).json({ error: "Failed to convert PCM to MP3" });
  }
}
