const functions = require('firebase-functions');

const app = require("express")();

const{ signup, login} = require("./handlers/users")

const cors = require('cors');
app.use(cors());

// Users route
app.post("/signup", signup);
app.post("/login", login);


exports.api = functions.region("asia-east2").https.onRequest(app);