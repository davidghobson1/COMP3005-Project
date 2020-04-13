# COMP3005-Project
Web-based application for the LookInnaBook online bookstore

This app is based on Node.js and Express.

To use the app, make sure you have all files including the package.json file in the same directory. Navigate to the directory in the command line and run "npm install". This should automatically download all the dependencies you need to run the app.

An important note: to use the app, Express has to connect to PostgreSQL. To allow this to happen, first, make sure your Postgres server is running! But also, open the postgres.js file in the /public directory, and on line 6, where it says:

const db = pgp('postgres://username:password@localhost:5432/database_name');

fill in your database information where it says "username", "password", and "database_name". (This is assuming that your Postgres runs through localhost 5432. If not, you'll have to edit that information in the command above as well.) Once you have filled in that information, save the file.

After that, run "node server.js" in the command line, navigate to http://localhost:3000/ on your favourite browser, and enjoy browsing and buying books!
