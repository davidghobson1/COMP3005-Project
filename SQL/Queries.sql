
-- QUERIES --

-----------------------------------------------------------------------------------------------------------
-- 1) Searching for books
--
-- Purpose: Allows users to find books based on search criteria
--
-- Details: Retrieves the books matching the search results based on book id, title, author, genre, and isbn. Search is not case sensitive and can handle blank spaces on the outside of the search terms
--

-- searching by book_id

SELECT * 
FROM book 
WHERE book_id = $1 
ORDER BY book_id ASC;

-- by title, author, genre, isbn

SELECT * 
FROM book 
WHERE LOWER(title) = LOWER($1) 
ORDER BY book_id ASC;

-- or analogous for author, genre, isbn

-----------------------------------------------------------------------------------------------------------
-- 2) Displaying book information
--
-- Purpose: Fill in the information for a book's page 
--
-- Retrieves the book information for the book's information including the book's title, author, genre, price, current stock level, description (hardcover, softcover, etc.), number of pages, publisher, ISBN, and Vendor ID (or book ID)
--

SELECT * 
FROM book 
WHERE book_id = $1;

-- and (to get the publisher information)

SELECT publisher_id, name 
FROM publisher 
WHERE publisher_id = $1;

-----------------------------------------------------------------------------------------------------------
-- 4) Displaying a user's basket
--
-- Purpose: Fill in the information for a user's basket
--
-- Details: For each book in their basket, retrieves the title, author, price, stock, and description
--

SELECT book_id, title, author, price, stock, description 
FROM book 
WHERE book_id IN (string with book_ids)
ORDER BY book_id ASC;

-----------------------------------------------------------------------------------------------------------
-- 5) User login
--
-- Purpose: Allows a user to login
--
-- Details: Queries the customer relation for the users username and password
--

SELECT * 
FROM customer 
WHERE username = $1 AND "password"=$2;

-----------------------------------------------------------------------------------------------------------
-- 6) Buying books
--
-- Purpose: Allows a user to checkout and buy the books in their basket
--
-- Details: Inserts a new sale into the sale relation for the whole purchase. This returns the new sale ID and order number. 
--          Using the sale id, and for each different book, the next query inserts a new purchase into the purchase relation
--	    The user is then sent their order number.
--

INSERT INTO sale (user_id, num_of_books, "cost", credit_card_number, exp_date, street_number, street_name, city, province, postal_code)
VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING sale_id, order_number;

-- and

INSERT INTO purchase (sale_id, book_id, quantity, "cost");
VALUES($1, $2, $3, $4);

-----------------------------------------------------------------------------------------------------------
-- 7) Searching for order information
--
-- Purpose: Allows a user to get the shipping information based on their order number
--
-- Details: based on the username, password, and order number, retrieves the shipping company name, tracking number, and shipping status
--

SELECT order_number, shipping_company_name, tracking_number, shipping_status 
FROM sale JOIN customer USING (user_id) 
WHERE username = $1 AND "password" = $2 AND order_number = $3;

-----------------------------------------------------------------------------------------------------------
-- 8) Adding books to the bookstore
--
-- Purpose: Allows the owner to add new books to the bookstore
--
-- Details: first queries to ensure the publisher exists in the database, then inserts the new book into the book relation
--

SELECT publisher_id FROM publisher WHERE name = $1;

-- and

INSERT INTO book (title, author, genre, isbn, numpages, price, stock, publisher_id, publisher_percentage, publisher_price, description);
VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);

-----------------------------------------------------------------------------------------------------------
-- 9) Removing books from the bookstore
--
-- Purpose: Allows the owner to remove books from the bookstore
--
-- Details: calls the delete_books procedure with a text string of the book IDs. See the delete_books procedure in Functions&Procedures.sql for more details.
--

CALL delete_books(string of book IDs);

-----------------------------------------------------------------------------------------------------------
-- 10) Sales vs. Expenditures
--
-- Purpose: Allows the owners to see the overall sales vs. expenditures information
--
-- Details: calls the sales_summary view. See the sales_summary view in Views.sql for more details.
--

SELECT * FROM sales_summary;

-----------------------------------------------------------------------------------------------------------
-- 11) Sales by category
--
-- Purpose: Allows the owner to view the sales by different category
--
-- Details: Retrieves the total revenue, and the total number of books sold either by title, author, or genre.
--

SELECT title as category, COALESCE(SUM(cost), 0) as total_sales, COALESCE(SUM(quantity),0) as number_of_books_sold 
FROM book NATURAL LEFT OUTER JOIN purchase 
GROUP BY title 
ORDER BY total_sales DESC, title ASC;

-- or analogous for author or genre.

