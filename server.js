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

//launch the app
app.listen(3000);
console.log("Listening on port 3000");

////////////////////////////////////////////////////////////
// Routes
////////////////////////////////////////////////////////////

////////////////// Customer Routes /////////////////////////

//Book-search routes
app.get("/searchBooksPage", sendBookSearchPage);
app.get("/books", searchBooks);
app.get("/book/:bookID", getBook);

//View/Add-to basket routes
app.get("/viewBasket", viewBasket);
app.post("/basket", updateBasket);

//Checkout routes
app.get("/checkout", checkout);
app.get("/login", login);
app.post("/placeOrder", placeOrder);

//Order viewing routes
app.get("/searchOrders", searchOrders);
app.get("/trackMyOrder", myOrders);

////////////////// Store Owner Routes //////////////////////

//Add/Removing Books routes
app.get("/updateInventory", sendInventoryPage);
app.post("/insertBook", checkPublisherName, insertBook);
app.delete("/removeBooks", removeBooks);

//Sales Reports routes
app.get("/salesReports", sendSalesReportPage);
app.get("/salesReport", sendSalesReport);

////////////////////////////////////////////////////////////
//
// Functions
//
////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////
////////////////// Customer Functions //////////////////////
////////////////////////////////////////////////////////////

//stores the users basket (I know this isn't a good way to store this, but I didn't have the time to set up sessions)
let basket = {};

//sends the Buy Books Page for users to search and buy books
function sendBookSearchPage(req, res, next){
	res.render("booksSearchPage");
	res.end();
}

//searches for books in the database and send them to the client
function searchBooks(req, res, next){
	let reqURL = url.parse(req.url, true);
	
	//parse the search criteria from the URL
	let category = reqURL.query.category;
	let key = reqURL.query.searchwords;
	if(category == 'Vendor ID'){
		category = 'book_id';
	}

	//query the database to find the matching books
	db.any('SELECT * FROM book WHERE ' + category + ' = $1 ORDER BY book_id ASC;', [key])
    .then(function(data) {

    	//form an object for the Template Engine
		let booksObj = {books: data};

		//send the appropriate data based on the request's Accept header
		res.format({

			//render the partial HTML page to display the matching books
			'text/html': function(){
				app.render("listBooks", booksObj, function(err, html){
					if(err){
						res.status(500).send("Database error rendering HTML page");
						return;
					}
					res.writeHead(200, { 'Content-Type': 'text/html' });
					res.end(html);
				});
			},

			//or send books as a JSON string
			'application/json': function(){
				res.json(data);
			},
		})

    });
}

//search for specific book, and send it to the client
function getBook(req, res, next){

	//query the database to find the book
	db.any('SELECT * FROM book WHERE book_id = $1', [req.params.bookID])
    .then(function(data) {

    	//if we can't find the book, send a 404
		if(data.length == 0){
			res.status(404).send("Sorry! Book ID not found!");
			return;
		}

		//query the database to get the publisher's information
		db.any('SELECT publisher_id, name FROM publisher WHERE publisher_id = $1', [data[0].publisher_id])
	    .then(function(publisherData) {

	    	//add the publisher's information to the book object
			if(publisherData.length == 0){
				data[0].publisher_name = "Not available";
			}else{
	    		data[0].publisher_name = publisherData[0].name;
			}
	    	
			res.format({
				//render the HTML page to display the book
				'text/html': function(){
					res.render("book", data[0]);
				},
				//send book to the client as a JSON string
				'application/json': function(){
					res.json(result);
				},

			});	
		})
	    .catch(function(error) {
	    	//if there is an error getting the publisher's name, send the book data anyway
	    	data[0].publisher_name = "Not available";

			res.format({
				//render the HTML page to display the book
				'text/html': function(){
					res.render("book", data[0]);
				},
				//send book to the client as a JSON string
				'application/json': function(){
					res.json(result);
				},
			});	
	    });	
        
    })
    .catch(function(error) {
		res.status(500).send("Database error: Error finding the book");
		return;
    });
}

//sends the View Basket page
function viewBasket(req, res, next){

	//if there are no books in the basket, render the page
	if(Object.keys(basket).length == 0){
		let bookObjs = {"books": []};
		app.render("basket", bookObjs, function(err, html){
			if(err){
				res.status(500).send("Database error rendering HTML page");
				return;
			}
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(html);
		});
		return ;
	}

	//if there are books in the basket

	//create the query string
	let book_ids = Object.keys(basket);
	let s = "(";
	for(let i = 0; i < book_ids.length-1; i++){
		s += book_ids[i] + ", ";
	}
	s += book_ids[book_ids.length-1] + ")";

	//query the database and render the page with the results
	db.any('SELECT book_id, title, author, price, stock, description FROM book WHERE book_id IN ' + s + ' ORDER BY book_id ASC;')
	.then(function(data){
		for(let i = 0; i < data.length; i++){
			data[i].quantity = basket[book_ids[i]];
		}

    	//form a book object for the Template Engine
		let booksObj = {books: data};

		//render the page
		app.render("basket", booksObj, function(err, html){
			if(err){
				res.status(500).send("Database error rendering HTML page");
				return;
			}
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(html);
		});
	})
	.catch(function(error) {
		res.status(500).send("Database error: Error retrieving books from the database");
		return;
    });
}

//adds books to the basket object
function updateBasket(req, res, next){
	let updates = req.body;
	for(key in updates){
		if(basket[key]){
			basket[key] += updates[key];
		}else{
			basket[key] = updates[key];
		}
	}
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.send();
}

//sends the Checkout Page and the initial Login section
function checkout(req, res, next){
	
	res.format({
	'text/html': function(){
		app.render("login", function(err, html){
			if(err){
				res.status(500).send("Database error rendering HTML page");
				return;
			}
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(html);
		});
	}});
}

//verifies the username and password of the user during checkout
//sends the additional checkout information if the user is found
function login(req, res, next){
	let reqURL = url.parse(req.url, true);

	let username = reqURL.query.username;
	let password = reqURL.query.password;

	let query = 'SELECT * FROM customer WHERE first_name = $1 AND last_name=$2';

	db.any(query, [username, password])
	.then(function(data){

		let userObj = {user: data};

		res.format({

			//renders the checkout page with the user's information
			'text/html': function(){
				app.render("checkoutInfo", userObj, function(err, html){
					if(err){
						res.status(500).send("Database error rendering HTML page");
						return;
					}
					res.writeHead(200, { 'Content-Type': 'text/html' });
					res.end(html);
				});
			},

			//or sends the user's info as a JSON string
			'application/json': function(){
				res.json(data);
			},
		})
	})
	.catch(function(error) {
		res.status(500).send("Database error: Error during search for the user");
		return;
    });
}

//places the order
//inserts the new sales and purchase items into the database
function placeOrder(req, res, next){

	let sale = req.body.sale;
	let purchases = req.body.purchases;

	//create the query to insert the sale
	let query1 = pg.pgp.helpers.insert(sale, ['user_id', 'num_of_books', 'cost', 'credit_card_number', 'exp_date', 'street_number', 'street_name', 'city', 'province', 'postal_code'], 'sale');

	//first create a new sale
	db.one(query1 + ' RETURNING sale_id, order_number, date;')
	.then(data => {

		//once the sale is created, create the new purchases

	    for(let i = 0; i < purchases.length; i++){
	    	let tmp = purchases[i];
	    	tmp["sale_id"] = data.sale_id;
	    	tmp["date"] = data.date;
	    	console.log(purchases[i]);
	    }

	    //create the query to insert the purchases
		let query2 = pg.pgp.helpers.insert(purchases, ['book_id', 'quantity', 'cost', 'sale_id', 'date'], 'purchase');

		//create the new purchases
		//send back the users order number
		db.many(query2 + ' RETURNING sale_id;')
		.then(data2 => {
		    res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(JSON.stringify(data.order_number));
		})
		.catch(error => {
		    res.status(500).send("Database error: Error adding purchases");
			return;
		});
	})
	.catch(error => {
	    res.status(500).send("Database error: Error adding the sale");
		return;
	});
}

//send the Track Orders Page
function searchOrders(req, res, next){
	res.render("trackOrders");
	res.end();
}

//find the order information for the user
function myOrders(req, res, next){
	let reqURL = url.parse(req.url, true);
	
	//query the database for the particular order based on the users username, password, and order number
	db.any('SELECT order_number, shipping_company_name, tracking_number, shipping_status FROM sale JOIN customer USING (user_id) WHERE first_name = $1 AND last_name = $2 AND order_number = $3;', [req.query.username, req.query.password, req.query.ordernumber])
		.then(data => {
			let orders = data;

			//if there are null attributes in the results, it means the data is not available yet
			for(let i = 0; i < orders.length; i++){
				for(key in orders[i]){
					if(orders[i][key] == null){
						orders[i][key] = "Not available";
					}
				}
			}

			let ordersObj = {"orders": orders}

			//send the information to the client
			res.format({

				//render the partial HTML page to list the order information
				'text/html': function(){
					res.render("listOrders", ordersObj, function(err, html){
						if(err){
							res.status(500).send("Database error rendering HTML page");
							return;
						}
						res.writeHead(200, { 'Content-Type': 'text/html' });
						res.end(html);
					});
				},

				//or send questions as a JSON string
				'application/json': function(){
					res.json(data);
				},
			})
		})
		.catch(error => {
		    res.status(500).send("Database error: Error retrieving order information");
			return;
	});
	
}

////////////////////////////////////////////////////////////
//////////////// Store Owner Functions /////////////////////
////////////////////////////////////////////////////////////

//sends the Inventory Page to the client
function sendInventoryPage(req, res, next){
	res.render("updateInventory");
	res.end();
}

//adds a new book to the database
function insertBook(req, res, next){

	//create the query
	let query = pg.pgp.helpers.insert(req.body, ['title', 'author', 'genre', 'isbn', 'numpages', 'price', 'stock', 'publisher_id', 'publishers_percentage', 'publishers_price', 'description',], 'book');
	
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

		//create object for the Template engine
		let dataObj = {};
		dataObj["data"] = data;

		//render the sales summary table and send the HTML to the client
		app.render("salesReportPage", dataObj, function(err, html){
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
	let query = 'SELECT ' + searchParameter + ' as category, SUM(cost) as total_sales, SUM(quantity) as number_of_books_sold FROM book NATURAL LEFT OUTER JOIN purchase GROUP BY ' + searchParameter + ' ORDER BY total_sales DESC, ' + searchParameter + ' ASC;';
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