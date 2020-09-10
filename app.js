const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");

//configuring the db credentials using the env file
dotenv.config({ path: "./.env" });

const app = express();

//Parse urlencoded bodies as sent by HTML forms
app.use(express.urlencoded({ extended: false }));

//this makes sure that the post request from forms are JSON bodies
app.use(express.json());

app.use(cookieParser());

//creating the connection with the db
const db = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

//setting up the public directory-where are you going to store the css and javascript files
const publicDirectory = path.join(__dirname, "./public");
app.use(express.static(publicDirectory));

//using the view engine
app.set("view engine", "ejs");

//checking the connection with the db
db.connect(function (error) {
  if (error) {
    console.log(error);
  } else {
    console.log("database connected");
  }
});

//Define routes

app.use("/", require("./routes/pages"));
app.use("/auth", require("./routes/auth"));

// app.get('/',function(req,res){
//     res.render('index');
// });
// app.get('/register', function(req,res){
//     res.render('register');
// });

//listening on port
app.listen(80, function () {
  console.log("The server is listening on port 80");
});
