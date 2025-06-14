--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_number text NOT NULL,
    customer_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0,
    shipping_amount numeric(12,2) DEFAULT 0,
    discount_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'USD'::text,
    notes text,
    billing_address json,
    shipping_address json,
    shipping_method text,
    tracking_number text,
    order_date timestamp without time zone DEFAULT now() NOT NULL,
    shipped_date timestamp without time zone,
    delivered_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO neondb_owner;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, order_number, customer_id, status, payment_status, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, currency, notes, billing_address, shipping_address, shipping_method, tracking_number, order_date, shipped_date, delivered_date, created_at, updated_at) FROM stdin;
5	ORD-1749787903550-BKNM9	1	delivered	pending	78.75	7.09	50.00	0.00	135.84	USD		{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	standard	\N	2025-06-13 04:11:43.719	\N	\N	2025-06-13 04:11:43.732826	2025-06-13 04:12:11.937
3	ORD-1749782065311-1RABJ	1	delivered	pending	1755.00	157.95	0.00	0.00	1912.95	USD		{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	standard	\N	2025-06-13 02:34:25.413	\N	\N	2025-06-13 02:34:25.425615	2025-06-13 02:59:28.89
1	ORD-1749779952414-NIOK3	1	delivered	pending	45.99	4.14	50.00	0.00	100.13	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	standard	\N	2025-06-13 01:59:12.544	\N	\N	2025-06-13 01:59:12.55602	2025-06-13 02:11:30.209
2	ORD-1749780109958-43Y4H	1	delivered	pending	32.50	2.93	50.00	0.00	85.43	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	express	\N	2025-06-13 02:01:49.981	\N	\N	2025-06-13 02:01:49.994158	2025-06-13 02:13:19.766
4	ORD-1749783637801-YJUS7	1	delivered	pending	365.25	32.87	50.00	0.00	448.12	USD		{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	express	\N	2025-06-13 03:00:37.907	\N	\N	2025-06-13 03:00:37.920409	2025-06-13 03:01:30.334
8	ORD-1749893441541-W7PF9	1	pending	pending	44.00	3.96	50.00	0.00	97.96	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	express	\N	2025-06-14 09:30:41.647	\N	\N	2025-06-14 09:30:41.660566	2025-06-14 09:30:41.660566
7	ORD-1749882311403-YJV8U	1	pending	pending	274.50	24.71	50.00	0.00	349.21	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	express	\N	2025-06-14 06:25:11.516	\N	\N	2025-06-14 06:25:11.528455	2025-06-14 06:25:11.528455
9	ORD-1749893474344-TQ5QI	1	pending	pending	78.75	7.09	50.00	0.00	135.84	USD		{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	express	\N	2025-06-14 09:31:14.44	\N	\N	2025-06-14 09:31:14.455454	2025-06-14 09:31:14.455454
6	ORD-1749819744483-QAJI3	1	delivered	pending	50.00	4.50	50.00	0.00	104.50	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	express	\N	2025-06-13 13:02:24.59	\N	\N	2025-06-13 13:02:24.603178	2025-06-14 06:35:34.09
10	ORD-1749893690345-SUFZM	2	pending	pending	2250.00	225.00	50.00	0.00	2525.00	USD	تست سیستم CRM خودکار	{"country":"Iran","city":"Tehran","address":"خیابان ولیعصر، پلاک 123","postalCode":"1234567890"}	{"country":"Iran","city":"Tehran","address":"خیابان ولیعصر، پلاک 123","postalCode":"1234567890"}	standard	\N	2025-06-14 09:34:50.498	\N	\N	2025-06-14 09:34:50.510526	2025-06-14 09:34:50.510526
\.


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.orders_id_seq', 10, true);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

