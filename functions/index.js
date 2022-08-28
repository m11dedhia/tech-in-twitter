require("dotenv").config({
  path: "../.env"
});
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const TwitterApi = require("twitter-api-v2").default;
const { Configuration, OpenAIApi } = require("openai");

const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_API_KEY,
  clientSecret: process.env.TWITTER_API_SECRET,
});

const config = new Configuration({
  // organization: '',
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

const dbReference = admin.firestore().doc("tokens/demo");
const callBackURL = "http://127.0.0.1:5000/tech-in-twitter/us-central1/callback";

exports.auth = functions.https.onRequest(async (req, res) => {
  try {
    // eslint-disable-next-line max-len
    const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(callBackURL, {
      scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    });
    // console.log(url);

    // store in DB
    await dbReference.set({ codeVerifier, state });

    res.redirect(url);
  } catch (error) {
    console.log(error);
  }
});

exports.callback = functions.https.onRequest(async (req, res) => {
  const { state, code } = req.query;
  const dbSnap = await dbReference.get();
  const { codeVerifier, state: storedState } = dbSnap.data();

  if (state !== storedState) return res.status(400).json({
    success: "false",
    message: "Stored tokens do not match!"
  });

  const {
    client: loggedClient,
    accessToken,
    refreshToken,
  } = await twitterClient.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: callBackURL,
  });

  await dbReference.set({ accessToken, refreshToken });
  res.status(200).json({ success: true });
});

exports.tweet = functions.https.onRequest(async (req, res) => {
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
    res.status(200).send(data);
  } catch (error) {
    console.log(error);
  }
});
