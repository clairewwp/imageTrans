require('dotenv').config();
const AWS = require('aws-sdk');
const express = require("express");
const router = express.Router();
const fs = require("fs");
const formidable = require("formidable");
const bucketName = 'claire-wikipedia-store';
AWS.config.credentials = new AWS.EC2MetadataCredentials();//addition added in
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const redis = require('redis');
const sharp = require('sharp')
const redisClient = redis.createClient();
router.post("/", async (req, res) => {
  (async () => {
    try {
      await redisClient.connect();
      if(s3.bucketName!=bucketName){
        await s3.createBucket({ Bucket: bucketName }).promise();
        console.log(`Created bucket:${bucketName}`);
      }
    } catch (error) {
      if (error.statusCode != 409) {
        console.log(`Error creating bucket:${error}`)
      }
    }
  })();

  let form = new formidable.IncomingForm();
  form.parse(req, async function (err, fields, files) {
    console.log(fields)//width and height
    let width = Number(fields.Width)
    let height = Number(fields.Height)
    const base64outcome=[];
    for (let i in form.openedFiles) {
      let originalPath = form.openedFiles[i].filepath;
      // console.log(originalPath)
      let image = fs.readFileSync(originalPath, function (err, data) {
        if (err) throw err;
      });
      let wholeBuffer=Buffer.from(image).toString("base64");//images
      let slicedBuffer = wholeBuffer.slice(-61, -38)+wholeBuffer.slice(100, 150);
      let imageKey='';
      imageKey=slicedBuffer.replace(/\//g, "\\")+`,${width}` + `,${height}`;

      //resizing
      let resized = await sharp(image).resize({
        width: width,
        height: height,
        fit: "contain",
        position: "right top",
      }).toBuffer()
      //key is the first 30 digit of uploaded image's buffer + selected width and height
      //while the body stores the whole buffer of the resized image
   
      let redisKey = imageKey
      let redisResult = await redisClient.get(redisKey)
      // console.log(redisKey)
      let s3Key = imageKey
      let params = {
        Bucket: bucketName,
        Key: s3Key,
      }
      try {
        if (redisResult) {//here is from Redis
          base64outcome.push({source:`${redisKey} is from Redis`,...redisResult})
          // res.json(redisResult)//not sure if I should pass this or image
          console.log('From redis')
        } else {//here is from S3
          const s3Result = await s3.getObject(params).promise();
          console.log('From s3')
          base64outcome.push({source:`${s3Key} is from S3 bucket`,...s3Result})
          // res.json(s3Result.Body)
        }
      } catch (e) {//here is from webpage
        if (e.statusCode === 404) {
          //fetch the img from front-end then store it in s3 and redis cache
          redisClient.setEx(
            redisKey,
            3600,
            resized,//Redis
          )
          let objectParams = {
            Bucket: bucketName,
            Key: s3Key,
            Body: resized,//S3
          }
          await s3.putObject(objectParams).promise();
          console.log(`Upload successfully to ${bucketName}/${s3Key}`)
          base64outcome.push({source:`${imageKey} is from the web`,...resized})
          // res.json(resized);//from front end 
          console.log("from webpage");
          
        } else {
          console.error
        }
      }
    }res.json(base64outcome)
  })
});


module.exports = router;
