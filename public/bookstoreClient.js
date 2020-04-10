/////////////////////////////////////////////////////////////////
//
//  Client-side Javascript
//
/////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////
// Customer Functionality
/////////////////////////////////////////////////////////////////

//send GET request for books based on the search criteria
function searchBooks(){

	//get the query path based on the options the client selected
	let path = getQueryParameters();

	//send the request for those books
	let xmlreq = new XMLHttpRequest();
	xmlreq.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){

			//hide the "Add to Basket" button
			let button = document.getElementById("addToBasket");
			button.hidden = true;

			//unhide the "Matching Questions" header"
			let title = document.getElementById("matchingBooksHeader");
			title.hidden = false;

			//append the question results to the HTML page
			let results = document.getElementById("books");
			results.innerHTML = this.responseText;

			//unhide the "Add to Basket" button
			if(this.responseText != "<div>No books found!</div>"){
				let button = document.getElementById("addToBasket");
				button.hidden = false;
			}
		
		}
	};
	xmlreq.open("GET", path, true);
	xmlreq.setRequestHeader("Accept", "text/html");
	xmlreq.send();
} 

//helper function to form a query path based on the options the client selects
function getQueryParameters(){
	
	let searchWords = encodeURIComponent(document.getElementById("searchbar").value);
	let category = document.getElementById("searchCategory").value;

	let path = '/books?category=' + category + '&searchwords=' + searchWords;

	return path;
}

//Add a book to the basket when viewing the book's page
function addToBasketBook(){
	let item = {};
	let book_id = document.getElementById("bookID").innerHTML;
	let quantity = parseInt(document.getElementById("quantity").value);
	item[book_id] = quantity;
	
	updateBasket(item);
}

//Add a books to the basket when viewing the search page
function addToBasketBooks(){
	let bookSection = document.getElementById("books");

	let items = {};
	for(let i = 0; i < bookSection.childElementCount; i ++){
		if(bookSection.childNodes[i].childNodes[0].checked){
			let book_id = bookSection.childNodes[i].childNodes[2].innerHTML
			items[book_id] = 1;
		}
	}
	updateBasket(items);
}

//send POST request to add books to the basket on the server
function updateBasket(b){
	//send an XML request to the server to update basket
	let xmlreq = new XMLHttpRequest();
	xmlreq.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			alert("Book(s) added to basket!");
		}
	};
	xmlreq.open("POST", "/basket", true);
	xmlreq.setRequestHeader("Content-Type", "application/json");
	xmlreq.send(JSON.stringify(b));
}

//send GET request to view the basket
function viewBasket(){
	//send an XML request to the server to view basket
	let xmlreq = new XMLHttpRequest();
	xmlreq.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			window.location.replace("/viewBasket");
		}
	};
	xmlreq.open("GET", "/viewBasket", true);
	xmlreq.setRequestHeader("Accept", "text/html");
	xmlreq.send();
}

//send GET request for the checkout page
function checkout(){
	//send an XML request to the server to view basket
	let xmlreq = new XMLHttpRequest();
	xmlreq.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){

			//append the login page to the HTML page
			let login = document.getElementById("login");
			login.innerHTML = this.responseText;
			login.hidden = false;
		}
	};
	xmlreq.open("GET", "/checkout", true);
	xmlreq.setRequestHeader("Accept", "text/html");
	xmlreq.send();
}

//send a GET request to login when checking out
function login(){
	let username = document.getElementById("username").value;
	let password = document.getElementById("password").value;

	let path = '/login?username=' + username + '&password=' + password;

	//send an XML request to the server to retrieve those questions
	let xmlreq = new XMLHttpRequest();
	xmlreq.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){

			//append the user results to the HTML page
			let results = document.getElementById("checkoutInfo");
			results.innerHTML = this.responseText;
			results.hidden = false;
		}	
	};
	xmlreq.open("GET", path, true);
	xmlreq.setRequestHeader("Accept", "text/html");
	xmlreq.send();
}

//send a POST request to complete an order
function submitOrder(){

	let saleObj = {};

	let sale = {};

	let cost = document.getElementById("grand_total").innerHTML;
	let num_of_books = document.getElementById("num_of_books").innerHTML;

	//get all the user's information	
	sale["user_id"] = document.getElementById("user_id").innerHTML;
	sale["num_of_books"] = num_of_books;
	sale["cost"] = cost;
	sale["credit_card_number"] = document.getElementById("credit_card_number").value;
	sale["exp_date"] = document.getElementById("exp_date").value;
	if(document.getElementById("apt_number")){
		sale["apt_number"] = document.getElementById("apt_number").value;
	}
	sale["street_number"] = document.getElementById("street_number").value;
	sale["street_name"] = document.getElementById("street_name").value;
	sale["city"] = document.getElementById("city").value;
	sale["province"] = document.getElementById("province").value;
	sale["postal_code"] = document.getElementById("postal_code").value;

	//get all the purchase information
	let books = document.getElementById("books");

	let purchases = [];
	for(let i = 0; i < books.childElementCount; i++){
		let id = books.childNodes[i].id;
		let quantity = document.getElementById("Qty." + id).innerHTML;
		let cost = document.getElementById("Cost." + id).innerHTML;

		let purchase = {};
		purchase["book_id"] =  id;
		purchase["quantity"] =  quantity;
		purchase["cost"] =  cost;

		purchases.push(purchase);
	}

	//send the user and purchase information to the server
	saleObj["sale"] = sale;
	saleObj["purchases"] = purchases;
	let xmlreq = new XMLHttpRequest();
	xmlreq.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			alert("Thank you for your purchase! \nYour order number is: " + this.responseText + "!\nPlease shop again soon!");
			window.location.replace("/");
		}
	};
	xmlreq.open("POST", "/placeOrder", true);
	xmlreq.setRequestHeader("Content-Type", "application/json");
	xmlreq.send(JSON.stringify(saleObj));

}

//send GET request for the user's order tracking information
function trackOrderLogin(){
	let username = document.getElementById("username").value;
	let password = document.getElementById("password").value;
	let order_number = document.getElementById("order_number").value;

	let path = '/trackMyOrder?username=' + username + '&password=' + password + '&ordernumber=' + order_number;

	let xmlreq = new XMLHttpRequest();
	xmlreq.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){

			let header = document.getElementById("yourOrdersHeader");
			header.hidden = false;

			//append the question results to the HTML page
			let order = document.getElementById("order");
			order.innerHTML = this.responseText;
			order.hidden = false;
		}
	};
	xmlreq.open("GET", path, true);
	xmlreq.setRequestHeader("Accept", "text/html");
	xmlreq.send();
}

////////////////////////////////////////////////////////////////////////
// Store Owner Functionality
////////////////////////////////////////////////////////////////////////

//send POST request to insert a book into the database
function addBook(){
	
	if(confirm("Finish adding the book?\nAll book information is correct?")){
		let book = {};

		book["title"] = document.getElementById("title").value;
		book["author"] = document.getElementById("author").value;
		book["genre"] = document.getElementById("genre").value;	
		book["isbn"] = document.getElementById("isbn").value;
		book["description"] = document.getElementById("description").value;	

		book["publisher_name"] = document.getElementById("publisher_name").value;
		book["numpages"] = document.getElementById("num_of_pages").value;
		book["publishers_percentage"] = document.getElementById("publishers_percentage").value;	
		book["publishers_price"] = document.getElementById("publishers_price").value;
		book["price"] = document.getElementById("price").value;	
		book["stock"] = document.getElementById("stock").value;	


		//send request to insert the book
		let xmlreq = new XMLHttpRequest();
		xmlreq.onreadystatechange = function(){
			if(this.readyState == 4 && this.status == 200){
				alert(this.responseText);
			}else if(this.readyState == 4 && this.status == 500){
				alert("Book not inserted!\n" + this.responseText);
			}
		};
		xmlreq.open("POST", "/insertBook", true);
		xmlreq.setRequestHeader("Content-Type", "application/json");
		xmlreq.send(JSON.stringify(book));
	}
}

//send GET request to search for books to remove from the database
function searchBooksToRemove(){

	let s = document.getElementById("searchbar").value;
	let cat = document.getElementById("searchCategory").value;

	//get the query path based on the options the client selected
	let path = getQueryParameters();

	//send an XML request to the server to retrieve those questions
	let xmlreq = new XMLHttpRequest();
	xmlreq.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){

			//hide the "Remove Book" button
			let button = document.getElementById("removeBook");
			button.hidden = true;

			//append the question results to the HTML page
			let results = document.getElementById("books");
			results.innerHTML = this.responseText;

			//unhide the "Add to Basket" button
			if(this.responseText != "<div>No books found!</div>"){
				let button = document.getElementById("removeBook");
				button.hidden = false;
			}
		}
	};
	xmlreq.open("GET", path, true);
	xmlreq.setRequestHeader("Accept", "text/html");
	xmlreq.send();
} 

//send DELETE request to delete the specified books from the database
function removeBook(){

	if(confirm("Confirm you want to delete these books from the inventory?")){
		let bookSection = document.getElementById("books");

		let book_ids = [];
		for(let i = 0; i < bookSection.childElementCount; i ++){
			if(bookSection.childNodes[i].childNodes[0].checked){
				book_ids.push(bookSection.childNodes[i].childNodes[2].innerHTML);
			}
		}

		//send request to delete the book(s)
		let xmlreq = new XMLHttpRequest();
		xmlreq.onreadystatechange = function(){
			if(this.readyState == 4){
				alert(this.responseText);
			}
			if(this.status == 200){
				window.location.href = "/updateInventory";
			}
		};
		xmlreq.open("DELETE", "/removeBooks", true);
		xmlreq.setRequestHeader("Content-Type", "application/json");
		xmlreq.send(JSON.stringify(book_ids));
	}
}

//send GET request for a particular Sales Report (ex. sales vs. genre)
function getSalesReport(){
	let category = document.getElementById("searchCategory").value;

	let path = '/salesReport?category=' + category;

	//send an XML request to the server to retrieve those questions
	let xmlreq = new XMLHttpRequest();
	xmlreq.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			let salesReport = document.getElementById("salesReportTable");
			salesReport.innerHTML = this.responseText;
			salesReport.hidden = false;
		}
	};
	xmlreq.open("GET", path, true);
	xmlreq.setRequestHeader("Accept", "text/html");
	xmlreq.send();
}

