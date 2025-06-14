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
-- Name: shop_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shop_products (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    short_description text,
    price numeric(10,2) NOT NULL,
    compare_at_price numeric(10,2),
    price_unit text NOT NULL,
    in_stock boolean DEFAULT true,
    stock_quantity integer DEFAULT 0,
    low_stock_threshold integer DEFAULT 10,
    sku text NOT NULL,
    barcode text,
    weight numeric(8,2),
    weight_unit text DEFAULT 'kg'::text,
    dimensions json,
    image_urls json,
    thumbnail_url text,
    specifications json,
    features json,
    applications json,
    tags json,
    minimum_order_quantity integer DEFAULT 1,
    maximum_order_quantity integer,
    lead_time text,
    shipping_class text,
    tax_class text DEFAULT 'standard'::text,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    meta_title text,
    meta_description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    quantity_discounts json
);


ALTER TABLE public.shop_products OWNER TO neondb_owner;

--
-- Name: shop_products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shop_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shop_products_id_seq OWNER TO neondb_owner;

--
-- Name: shop_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shop_products_id_seq OWNED BY public.shop_products.id;


--
-- Name: shop_products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_products ALTER COLUMN id SET DEFAULT nextval('public.shop_products_id_seq'::regclass);


--
-- Data for Name: shop_products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shop_products (id, name, category, description, short_description, price, compare_at_price, price_unit, in_stock, stock_quantity, low_stock_threshold, sku, barcode, weight, weight_unit, dimensions, image_urls, thumbnail_url, specifications, features, applications, tags, minimum_order_quantity, maximum_order_quantity, lead_time, shipping_class, tax_class, is_active, is_featured, meta_title, meta_description, created_at, updated_at, quantity_discounts) FROM stdin;
1	Industrial Water Clarifier WC-500	water-treatment	High-performance water clarifying agent for industrial applications. Removes suspended particles and turbidity effectively.	Professional water clarifier for industrial use	45.99	\N	per 5L	t	24	10	WC-500-5L	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 01:59:12.64	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
2	Pool Chlorine Stabilizer CS-100	water-treatment	Cyanuric acid-based stabilizer that protects chlorine from UV degradation in swimming pools and water systems.	UV-resistant chlorine stabilizer	32.50	\N	per 10kg	t	39	10	CS-100-10KG	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 02:01:50.083	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
6	NPK Fertilizer Complex 20-10-10	agricultural	Balanced NPK fertilizer with nitrogen, phosphorus, and potassium for optimal plant growth and yield.	Balanced NPK fertilizer complex	65.00	\N	per 25kg	t	-7	10	NPK-201010-25KG	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 02:34:25.517	[\n  {"minQty": 5, "discount": 0.03},\n  {"minQty": 20, "discount": 0.08},\n  {"minQty": 100, "discount": 0.20}\n]
3	Fuel System Cleaner Premium FSC-Pro	fuel-additives	Advanced fuel injector cleaner that removes carbon deposits and improves engine performance. Compatible with gasoline and diesel.	Premium fuel system cleaner	28.75	\N	per 500ml	t	57	10	FSC-PRO-500ML	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-14 09:31:14.542	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
14	Fuel System Cleaner Pro	fuel-additives	Advanced fuel system cleaner that removes deposits and improves engine performance	\N	50.00	\N	unit	t	149	20	SP-1-FUEL-SYSTE	\N	\N	kg	\N	["/uploads/images/product-1749823118120-593693181.jpeg"]	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-14 09:31:14.663	\N
4	Diesel Anti-Gel Additive DAG-Winter	fuel-additives	Prevents fuel gelling in cold weather conditions. Improves cold flow properties of diesel fuel.	Winter diesel anti-gel protection	15.25	\N	per 250ml	t	-22	5	DAG-WINTER-250ML	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-14 09:34:50.592	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
16	محصول تست لیزر اسکنر	chemicals	محصول تستی برای آزمایش لیزر اسکنر USB	\N	250.00	\N	per unit	t	100	20	USB-TEST-001	1234567890123	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-14 10:07:14.379112	2025-06-14 10:07:14.379112	\N
5	Paint Thinner Professional PT-Grade	paint-solvents	High-quality paint thinner for professional painting applications. Fast-evaporating and residue-free.	Professional grade paint thinner	22.00	\N	per 1L	t	0	5	PT-GRADE-1L	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 01:50:58.996872	\N
13	NPK Fertilizer Complex	agricultural-fertilizers	Balanced NPK fertilizer for optimal crop growth	\N	50.00	\N	unit	t	75	15	SP-4-NPK-FERTIL	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-14 06:28:16.219	\N
12	Premium Paint Thinner	paint-thinner	Professional grade paint thinner for industrial use	\N	50.00	\N	unit	t	0	30	SP-3-PREMIUM-PA	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-14 06:28:16.318	\N
15	Water Treatment Chemical A1	water-treatment	High-quality water treatment solution for industrial applications	\N	50.00	\N	unit	t	16	25	SP-2-WATER-TREA	\N	\N	kg	\N	["/uploads/images/product-1749822983330-60758320.jpeg"]	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-14 06:28:16.362	\N
\.


--
-- Name: shop_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shop_products_id_seq', 16, true);


--
-- Name: shop_products shop_products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT shop_products_pkey PRIMARY KEY (id);


--
-- Name: shop_products shop_products_sku_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT shop_products_sku_key UNIQUE (sku);


--
-- PostgreSQL database dump complete
--

