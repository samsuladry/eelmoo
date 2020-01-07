const functions = require('firebase-functions');
const admin = require("firebase-admin");
const cors = require('cors');

const app = require("express")();
admin.initializeApp();

const firebaseConfig = 
{
    apiKey: "AIzaSyCjfuvQknOPvUPejaOrvi3KQKcGfyUxaFA",
    authDomain: "eelmoo-70351.firebaseapp.com",
    databaseURL: "https://eelmoo-70351.firebaseio.com",
    projectId: "eelmoo-70351",
    storageBucket: "eelmoo-70351.appspot.com",
    messagingSenderId: "817460638819",
    appId: "1:817460638819:web:9e288e87bee1d575513456",
    measurementId: "G-FV3BDXRZ2N"
  };



const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();


const isEmail = (email) =>
{
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true;
    else return false;
}

const isEmpty = (String) => 
{
    if(String.trim() === "") return true;
    else return false;
}

app.use(cors());


//Signup route
app.post("/signup", (req, res) => 
{
    const newUser = 
    {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    let errors = {};

    if(isEmpty(newUser.email))
    {
        errors.email = "Must not be empty";
    }
    else if(!isEmail(newUser.email))
    {
        errors.email = "Must be a valid email address";
    }

    if(isEmpty(newUser.password)) errors.password = "Must not be empty";
    if(newUser.password !== newUser.confirmPassword) 
        errors.confirmPassword = "passwords must match";
    if(isEmpty(newUser.handle)) errors.handle = "Must not be empty";

    if(Object.keys(errors).length > 0 ) return res.status(400).json(errors);

    //TODO: validate data

    let token, userId;
    db.doc(`/users/${newUser.handle}`)
        .get()
        .then(doc => 
            {
                if(doc.exists)
                {
                    return res.status(400). json({ handle: 'this handle is already taken'});
                }
                else
                {
                   return firebase
                            .auth()
                            .createUserWithEmailAndPassword(newUser.email, newUser.password);
                }
            })
        .then((data) => 
        {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idToken) => 
            {
               token = idToken;
                const userCredentials = 
                {
                    handle: newUser.handle,
                    email: newUser.email,
                    createdAt: new Date().toISOString(),
                    userId
                };
                return db.doc(`/users/${newUser.handle}`).set(userCredentials);

            })
        .then(() => 
            {
                return res.status(201).json({ token });
            })
        .catch((err) => 
            {
                console.error(err);
                if (err.code === "auth/email-already-in-use" )
                {
                    return res.status(400).json({ email: " Email is already in use" });
                }
                else
                {
                    return res.status(500).json({ error: err.code });
                }
                
            });
});

// Login function

app.post("/login", (req, res) => 
 {
     const user = 
     {
         email: req.body.email,
         password: req.body.password
     };

     let errors = {}; 

     if(isEmpty(user.email)) errors.email = "Must not be empty";
     if(isEmpty(user.password)) errors.password = "Must not be empty";

     if(Object.keys(errors).length > 0) return res.status(400).json(errors);

     firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then((data) => 
        {
            return data.user.getIdToken();
        })
        .then((token) =>
        {
            return res.json({ token });
        })
        .catch((err) =>
        {
            console.error(err);
            if (err.code === "auth/wrong-password")
            {
                return res
                    .status(403)
                    .json({ general: "Wrong credentials, please try again"});
            }
            else return res.status(500).json({ error: err.code });
        });

 });


exports.api = functions.region("asia-east2").https.onRequest(app);