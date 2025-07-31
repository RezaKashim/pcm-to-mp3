const express = require("express");
const convert = require("./api/convert");

const app = express();
app.post("/api/convert", convert);

app.get("/", (req, res) => {
  res.send("PCM to MP3 API is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
