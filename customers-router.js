const express = require('express');
const fs = require("fs");
let url = require("url");

//connect to PostgreSQL
let pg = require("./public/postgres");
let db = pg.db;

let router = express.Router();

router.get("/", storeHomePage);

//Book-search routes
router.get("/searchBooksPage", sendBookSearchPage);
router.get("/books", searchBooks);
router.get("/book/:bookID", getBook);

//View/Add-to basket routes
router.get("/viewBasket", viewBasket);
router.post("/basket", updateBasket);

//Checkout routes
router.get("/checkout", checkout);
router.get("/login", login);
router.post("/placeOrder", placeOrder);

//Order viewing routes
router.get("/searchOrders", searchOrders);
router.get("/trackMyOrder", myOrders);

//////////////////////////////////////////////////////////
// Customer functions
//////////////////////////////////////////////////////////

//stores the users basket (I know this isn't a good way to store this, but I didn't have the time to set up sessions)
let basket = {};

function storeHomePage(req, res, next){
	res.render("storeHomePage");
	res.end();
}

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

	let query = 'SELECT * FROM book WHERE LOWER(' + category + ') = LOWER($1) ORDER BY book_id ASC;'

	if(category == 'Vendor ID'){
		query = 'SELECT * FROM book WHERE book_id = $1 ORDER BY book_id ASC;'
	}

	//query the database to find the matching books
	db.any(query, [key])
    .then(function(data) {

    	//form an object for the Template Engine
		let booksObj = {books: data};

		//send the appropriate data based on the request's Accept header
		res.format({

			//render the partial HTML page to display the matching books
			'text/html': function(){
				res.render("listBooks", booksObj, function(err, html){
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

		res.format({

			//render the partial HTML page to display the matching books
			'text/html': function(){
				res.render("basket", bookObjs, function(err, html){
					if(err){
						res.status(500).send("Database error rendering HTML page");
						return;
					}
					res.writeHead(200, { 'Content-Type': 'text/html' });
					res.end(html);
				});
			}
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
		res.render("basket", booksObj, function(err, html){
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
		res.render("login", function(err, html){
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

	let query = 'SELECT * FROM customer WHERE username = $1 AND "password"=$2';

	db.any(query, [username, password])
	.then(function(data){

		let userObj = {user: data};

		res.format({

			//renders the checkout page with the user's information
			'text/html': function(){
				res.render("checkoutInfo", userObj, function(err, html){
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
	db.one(query1 + ' RETURNING sale_id, order_number;')
	.then(data => {

		//once the sale is created, create the new purchases

	    for(let i = 0; i < purchases.length; i++){
	    	let tmp = purchases[i];
	    	tmp["sale_id"] = data.sale_id;
	    	console.log(purchases[i]);
	    }

	    //create the query to insert the purchases
		let query2 = pg.pgp.helpers.insert(purchases, ['book_id', 'quantity', 'cost', 'sale_id'], 'purchase');

		//create the new purchases
		//send back the users order number
		db.many(query2 + ' RETURNING sale_id;')
		.then(data2 => {
			basket = {};
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
	db.any('SELECT order_number, shipping_company_name, tracking_number, shipping_status FROM sale JOIN customer USING (user_id) WHERE username = $1 AND "password" = $2 AND order_number = $3;', [req.query.username, req.query.password, req.query.ordernumber])
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

//Export the router so it can be used on the server
module.exports = router;
