require("dotenv").config();
const express = require("express");
const app = express();
const cron = require("node-cron");
// const functions = require("firebase-functions");

const admin = require("firebase-admin");
const credentials = require("./credentials.json");
admin.initializeApp({ credential: admin.credential.cert(credentials) });

const TwitterApi = require("twitter-api-v2").default;
const { Configuration, OpenAIApi } = require("openai");

const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_API_KEY,
  clientSecret: process.env.TWITTER_API_SECRET,
});

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

const dbReference = admin.firestore().doc("tokens/demo");
const callBackURL = "http://127.0.0.1:5000/tech-in-twitter/us-central1/callback";

cron.schedule('*/30 * * * *', async () => {
  try {
    const db = await dbReference.get();
    const { refreshToken } = db.data();
    
    const {
      client: refereshedClient,
      accessToken,
      refreshToken: newRefreshToken,
    } = await twitterClient.refreshOAuth2Token(refreshToken);

    await dbReference.set({ accessToken, refreshToken: newRefreshToken });
    
    const tweet = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: "tweet something cool for #techtwitter",
      max_tokens: 64,
    });
    
    const { data } = await refereshedClient.v2.tweet(tweet.data.choices[0].text);
    console.log(`${new Date()}: tweet sent`);
    // res.status(200).send(data);
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`app listening on port: ${process.env.PORT}`);
});

