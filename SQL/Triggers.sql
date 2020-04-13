
-- TRIGGER: book_purchase ON purchase 
--
-- Overview: Updates the stock in books whenever a purchase is made (done before inserts on purchase)
--
-- Purpose: Properly maintain the book stock levels in the bookstore
--
-- Details: Subtracts the number of books being purchased from the current stock level of the book in the books relation
--	

CREATE FUNCTION update_stock() 
RETURNS trigger AS $update_stock$
	BEGIN
		UPDATE book
		SET stock = stock - NEW.quantity
		WHERE book_id = NEW.book_id;
	RETURN NEW;
	END;
$update_stock$ LANGUAGE plpgsql;

CREATE TRIGGER book_purchase
    BEFORE INSERT ON purchase
    FOR EACH ROW
    EXECUTE PROCEDURE update_stock();


-- Ordering more stock if stock dips below 10 (orders number of books sold last month + 20 extra)


-- TRIGGER: check_to_order_stock ON book
--
-- Overview: Checks whether new stock should be ordered after a book has been purchased (done after updates on book) and
--           orders more books based on the previous months sales
--
-- Purpose: Replenish book stock when the stock is too low
--
-- Details: calls the number_of_books_sold_last_month() function to determine the number of those books sold last month
--          and places an order for that number of books plus 20 extra
--

CREATE FUNCTION order_stock()
RETURNS trigger AS $order_stock$
	DECLARE order_quantity integer := number_of_books_sold_last_month(NEW.book_id);
	BEGIN
		IF NEW.stock < 10 AND NEW.stock IS NOT NULL AND NEW.book_id NOT IN (SELECT book_id FROM store_order) THEN
			INSERT INTO store_order (book_id, quantity, cost, status)
			VALUES(NEW.book_id, 20+order_quantity,(20+order_quantity)*NEW.publishers_price, 'Sent');
		END IF;
	RETURN NEW;
	END;
$order_stock$ LANGUAGE plpgsql;

CREATE TRIGGER check_to_order_stock
    AFTER UPDATE ON book
    FOR EACH ROW
    EXECUTE PROCEDURE order_stock();

