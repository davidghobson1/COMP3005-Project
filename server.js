const express = require('express');
let fs = require("fs");
let url = require("url");

//connect to PostgreSQL
let pg = require("./public/postgres");
let db = pg.db;

let app = express();
app.use(express.json());

//set Pug as the view engine
app.set("view engine", "pug");

//set up the homepage
app.use(express.static("public"));

//customer router for handling the /store path
let customersRouter = require("./customers-router");
app.use("/store", customersRouter);

//owner router for handling the /owner path
let ownersRouter = require("./owners-router");
app.use("/owners", ownersRouter);

//launch the app
app.listen(3000);
console.log("Listening on port 3000");
