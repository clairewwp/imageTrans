const express = require('express')
const app = express()
const upload=require('./routes/upload.js')
const path=require('path')
const hostname = "127.0.0.1";
const port = 3000;
const fs=require('fs')
const formidable = require('express-formidable');

const Ffmpeg = require("fluent-ffmpeg");
const FfmpegPath = require("@ffmpeg-installer/ffmpeg");

Ffmpeg.setFfmpegPath(FfmpegPath.path);
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use('/upload',upload)
app.use(formidable())

app.get("/", (req, res) => {
    res.writeHead(200, { "content-type": "text/html"});
    fs.readFile("index.html", "utf8", (error, data) => {
        if (error) {
        res.end("Could not load the page\n");
      } else {
        res.end(data);
      }
    });
 
  });
app.use(express.static(path.join(__dirname, 'public'))); //maybe later these two will not be necessay

app.listen(port, function () {
    console.log(`Express app listening at http://${hostname}:${port}/`);
  });

  module.exports = app;