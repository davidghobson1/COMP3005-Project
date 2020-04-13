
-- VIEW: sales_summary
--
-- Overview: Provides a summary of the overall sales vs. expenditures. Organizes information by month
--
-- Purpose: For convenient access
--
-- Details:
--	Calculates the total sales from all books sold that month, the total amount owed to all publishers from the sales,
--	the total cost for all store orders made that month, and the net revenue from all of these together

CREATE VIEW sales_summary AS
	SELECT *, gross_revenue - fees_to_publishers - COALESCE(store_order_costs, 0) AS net_revenue
	FROM (SELECT to_char(date, 'Month') AS "month", SUM(cost) AS gross_revenue, SUM(ROUND(cost*publishers_percentage/100, 2)) AS fees_to_publishers
	      FROM book NATURAL JOIN (SELECT sale_id, book_id, quantity, purchase.cost, sale.date
				      FROM purchase JOIN sale USING (sale_id)) AS purchase
	      GROUP BY to_char(date, 'Month')) AS sales
	LEFT OUTER JOIN
	(SELECT to_char(date, 'Month') AS "month", SUM("cost") AS "store_order_costs", COUNT("cost") AS "number_of_store_orders"
	FROM store_order
	GROUP BY to_char(date, 'Month')) AS orders 
        USING ("month")
