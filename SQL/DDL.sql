
CREATE TABLE customer
(user_id serial,
 first_name varchar(20) NOT NULL, 
 last_name varchar(20) NOT NULL,
 street_number varchar(10),
 street_name varchar(30),
 city varchar(15),
 province varchar(15),
 postal_code varchar(10),
 apt_number varchar(7),
 email varchar(20) NOT NULL,
 credit_card_number varchar(20),
 exp_date varchar(5),
 username varchar(30) UNIQUE NOT NULL,
 "password" varchar(30) NOT NULL,
 PRIMARY KEY (user_id)
);

CREATE TABLE book
(book_id serial,
 title varchar(30) NOT NULL,
 author varchar(30) NOT NULL,
 genre varchar(20),
 isbn varchar(17) NOT NULL,
 num_pages integer CHECK (numpages >= 0),
 description varchar(20),
 price numeric(6,2) CHECK (price >= 0),
 stock integer CHECK (stock >= 0),
 publisher_id integer,
 publishers_percentage numeric(2,0),
 publishers_price numeric(6,2),
 PRIMARY KEY (book_id),
 FOREIGN KEY (publisher_id) REFERENCES publisher
	ON UPDATE CASCADE
);

CREATE TABLE publisher
(publisher_id serial,
 name varchar(30) NOT NULL, 
 street_number varchar(10),
 street_name varchar(30),
 city varchar(15),
 province varchar(15),
 postal_code varchar(10),
 phone_number varchar(10),
 email varchar(20) NOT NULL,
 bank_name varchar(20),
 bank_account_number varchar(30),
 PRIMARY KEY (publisher_id)
);

CREATE TABLE sale
(sale_id serial,
 user_id integer NOT NULL,
 num_of_books integer NOT NULL CHECK (num_of_books >= 0),
 "cost" numeric(8,2) NOT NULL CHECK(cost >= 0),
 order_number serial NOT NULL UNIQUE,
 credit_card_number varchar(20) NOT NULL,
 exp_date varchar(5) NOT NULL,
 street_number varchar(10) NOT NULL,
 street_name varchar(30) NOT NULL,
 city varchar(15) NOT NULL,
 province varchar(15) NOT NULL,
 postal_code varchar(10) NOT NULL,
 apt_number varchar(7),
 shipping_company_name varchar(20),
 tracking_number varchar(20),
 shipping_status varchar(12),
 "date" date NOT NULL DEFAULT current_date,
 "time" time NOT NULL DEFAULT current_time,
 PRIMARY KEY (sale_id),
 FOREIGN KEY (user_id) REFERENCES customer
);

CREATE TABLE purchase
(sale_id integer,
 book_id integer,
 quantity integer NOT NULL CHECK(quantity >= 0),
 cost numeric(8,2) NOT NULL CHECK (cost >=0),
 PRIMARY KEY (sale_id, book_id),
 FOREIGN KEY (sale_id) REFERENCES sale,
 FOREIGN KEY (book_id) REFERENCES book
);

CREATE TABLE store_order
(store_order_id serial,
 book_id integer NOT NULL, 
 "date" date NOT NULL DEFAULT current_date ,
 quantity integer NOT NULL,
 cost numeric(6,2),
 status varchar(12),
 PRIMARY KEY (store_order_id),
 FOREIGN KEY (book_id) REFERENCES book
	ON DELETE CASCADE
);