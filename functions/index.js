const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// const dbReference = admin.firestore().doc.apply("tokens");
// const callBackURL = "http://127.0.0.1:5000/tech-in-twitter/us-central1/callback";

exports.auth = functions.https.onRequest((req, res) => {});

exports.callback = functions.https.onRequest((req, res) => {});

exports.tweet = functions.https.onRequest((req, res) => {});
