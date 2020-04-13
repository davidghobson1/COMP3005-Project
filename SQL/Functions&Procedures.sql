
-- FUNCTION: number_of_books_sold_last_month(int)
--
-- Overview: Calculates the number of books sold in the previous month for the given book_id (an integer)
--
-- Purpose: Helper function for the check_to_order_stock trigger, and for convenient access
--
-- Details:
--	Input: integer representing the book_id of the book you are inquiring about

CREATE FUNCTION number_of_books_sold_last_month(integer) 
RETURNS integer AS $$
	SELECT COALESCE(number_sold_last_month, 0)::integer
	FROM book NATURAL LEFT OUTER JOIN (SELECT book_id, SUM(quantity) AS  number_sold_last_month 
					   FROM purchase JOIN sale USING (sale_id)
				           WHERE MOD(EXTRACT(MONTH from sale.date)::integer, 12) = MOD(EXTRACT(MONTH from current_date)::integer, 12) - 1
					   GROUP BY book_id) AS previous_month_sales
	WHERE book_id = $1;
$$
LANGUAGE SQL;


-- PROCEDURE: delete_books(text)
--
-- Overview: Deletes the specified books. If the book has not been purchased, the tuple is deleted from the book relation; if it has been purchased, its stock
--           is set to null indicating the book has been discontinued
-- 
-- Purpose: Provide more streamlined functionality when owners delete books from the database
--
-- Details:
--	Input: A string representing the list of book_ids to be deleted
--		ex. '1, 4, 5, 16' (will delete books with ids 1, 4, 5, and 16
--

CREATE OR REPLACE PROCEDURE delete_books(text) AS
$$
DECLARE book_IDs INTEGER[] := string_to_array($1, ', ');
		x INTEGER;
BEGIN
	FOREACH x IN ARRAY book_IDs LOOP 
		IF x in (SELECT distinct book_id FROM purchase) THEN
	   		UPDATE book
			SET stock = null
			WHERE book_id = x;
		ELSE
			DELETE FROM book
			where book_id = x;
		END IF;
	END LOOP;
END;
$$



