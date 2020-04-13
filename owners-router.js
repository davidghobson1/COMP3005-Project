const express = require('express');
const fs = require("fs");
let url = require("url");

//connect to PostgreSQL
let pg = require("./public/postgres");
let db = pg.db;

let router = express.Router();

router.get("/", ownersHomePage);

//Add/Removing Books routes
router.get("/updateInventory", sendInventoryPage);
router.post("/insertBook", checkPublisherName, insertBook);
router.delete("/removeBooks", removeBooks);

//Sales Reports routes
router.get("/salesReports", sendSalesReportPage);
router.get("/salesReport", sendSalesReport);

//////////////////////////////////////////////////////////
// Owner functions
//////////////////////////////////////////////////////////

//sends the Inventory Page to the client
function ownersHomePage(req, res, next){
	res.render("ownersHomePage");
	res.end();
}

//sends the Inventory Page to the client
function sendInventoryPage(req, res, next){
	res.render("updateInventory");
	res.end();
}

//adds a new book to the database
function insertBook(req, res, next){

	//create the query
	let query = pg.pgp.helpers.insert(req.body, ['title', 'author', 'genre', 'isbn', 'num_pages', 'price', 'stock', 'publisher_id', 'publishers_percentage', 'publishers_price', 'description',], 'book');
	
	//add the book to the database and send back the book_id
	db.one(query + ' RETURNING book_id;')
	.then(data => {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end("Book inserted into database!\nBook ID: " + data.book_id);
	})
	.catch(error => {
		res.status(500).send("Database error: Could not insert book into database!");
		return;
	});
}

//when inserting a new book, this function makes sure the publisher's name exists in the database
//it also adds the publisher's id to the request object so that the book can be properly added to the database
function checkPublisherName(req, res, next){
	
	//query the database for the publisher's name
	db.one('SELECT publisher_id FROM publisher WHERE name = $1', [req.body.publisher_name])
	.then(data => {
		//add the publisher's id to the request object
		req.body.publisher_id = data.publisher_id;
		next();
	})
	.catch(error => {
		res.status(500).send("Could not find publisher name!");
		return;
	});
}

//removes the book(s) from the database
//books are removed by calling the "delete_books" procedure in the database
//books are either removed if they've never been bought, or their stock is set to null indicating the book has been discontinued
function removeBooks(req, res, next){

	//extract the book_ids sent by the client
	let s = "";
	for(let i = 0; i < req.body.length - 1; i++){
		s += (req.body[i] + ', ');
	}
	s += req.body[req.body.length-1];

	//pass the book_ids to the database procedure which will find and delete them
	db.proc('delete_books', [s])
    .then(data => {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end("Books deleted!");
    })
    .catch(error => {
        res.status(500).send("Database error: Error deleting books");
		return;
    });
}

//sends the Sales Report Page
//this involves querying the database for the summary of sales vs expenditures
function sendSalesReportPage(req, res, next){

	//query the database for the sales vs expenditures table
	db.any('SELECT * FROM sales_summary')
	.then(data => {

		console.log(data);

		//create object for the Template engine
		let dataObj = {};
		dataObj["data"] = data;

		//render the sales summary table and send the HTML to the client
		res.render("salesReportPage", dataObj, function(err, html){
			if(err){
				res.status(500).send("Database error rendering HTML page");
				return;
			}
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(html);
		});
	})
	.catch(error => {
        res.status(500).send("Database error: Error finding sales summary");
		return;
	});
}

//Sends sales report 
//This is either of sales by title, author, or genre 
function sendSalesReport(req, res, next){
	let reqURL = url.parse(req.url, true);

	//get search criteria from URL
	let searchParameter = reqURL.query.category;
	
	//query the database
	let query = 'SELECT ' + searchParameter + ' as category, COALESCE(SUM(cost), 0) as total_sales, COALESCE(SUM(quantity),0) as number_of_books_sold FROM book NATURAL LEFT OUTER JOIN purchase GROUP BY ' + searchParameter + ' ORDER BY total_sales DESC, ' + searchParameter + ' ASC;';
	db.any(query, [searchParameter])
	.then(data => {

		//create object for the Template engine
		let reportObj = {};
		reportObj.data = data;
		reportObj.category = searchParameter;

		res.format({

			//render the results in an HTML template
			'text/html': function(){
				res.render("salesReport", reportObj, function(err, html){
					if(err){
						res.status(500).send("Database error rendering HTML page");
						return;
					}
					res.writeHead(200, { 'Content-Type': 'text/html' });
					res.end(html);
				});
			},

			//OR send tuples as a JSON string
			'application/json': function(){
				res.json(data);
			},
		});
	})
	.catch(error => {
        res.status(500).send("Database error: Error finding sales report");
		return;
	});
}


//Export the router so it can be used on the server
module.exports = router;