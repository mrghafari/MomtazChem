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
-- Name: crm_customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.crm_customers (
    id integer NOT NULL,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    company text,
    phone text,
    alternate_phone text,
    country text,
    state text,
    city text,
    address text,
    postal_code text,
    industry text,
    business_type text,
    company_size text,
    annual_revenue text,
    customer_type text DEFAULT 'retail'::text NOT NULL,
    customer_status text DEFAULT 'active'::text NOT NULL,
    customer_source text DEFAULT 'website'::text NOT NULL,
    assigned_sales_rep text,
    total_orders_count integer DEFAULT 0,
    total_spent numeric(12,2) DEFAULT 0,
    average_order_value numeric(10,2) DEFAULT 0,
    last_order_date timestamp without time zone,
    first_order_date timestamp without time zone,
    last_contact_date timestamp without time zone,
    next_follow_up_date timestamp without time zone,
    communication_preference text DEFAULT 'email'::text,
    preferred_language text DEFAULT 'en'::text,
    marketing_consent boolean DEFAULT false,
    product_interests json,
    price_range text,
    order_frequency text,
    credit_limit numeric(10,2),
    payment_terms text DEFAULT 'immediate'::text,
    preferred_payment_method text,
    credit_status text DEFAULT 'good'::text,
    tags json,
    internal_notes text,
    public_notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by text DEFAULT 'system'::text
);


ALTER TABLE public.crm_customers OWNER TO neondb_owner;

--
-- Name: crm_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.crm_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crm_customers_id_seq OWNER TO neondb_owner;

--
-- Name: crm_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.crm_customers_id_seq OWNED BY public.crm_customers.id;


--
-- Name: crm_customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crm_customers ALTER COLUMN id SET DEFAULT nextval('public.crm_customers_id_seq'::regclass);


--
-- Data for Name: crm_customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.crm_customers (id, email, first_name, last_name, company, phone, alternate_phone, country, state, city, address, postal_code, industry, business_type, company_size, annual_revenue, customer_type, customer_status, customer_source, assigned_sales_rep, total_orders_count, total_spent, average_order_value, last_order_date, first_order_date, last_contact_date, next_follow_up_date, communication_preference, preferred_language, marketing_consent, product_interests, price_range, order_frequency, credit_limit, payment_terms, preferred_payment_method, credit_status, tags, internal_notes, public_notes, is_active, created_at, updated_at, created_by) FROM stdin;
1	ahmad.petrochemical@example.com	احمد	پتروشیمی	شرکت پتروشیمی ایران	+98-21-88776655	\N	Iran	\N	Tehran	\N	\N	\N	\N	\N	\N	b2b	active	website	\N	5	45000.00	9000.00	2025-05-14 09:34:31.929683	2024-12-14 09:34:31.929683	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 09:34:31.929683	2025-06-14 09:34:31.929683	auto_order
2	fateme.distribution@example.com	فاطمه	توزیع	شرکت توزیع مواد شیمیایی	+98-31-77889900	\N	Iran	\N	Isfahan	\N	\N	\N	\N	\N	\N	distributor	active	referral	\N	12	78500.00	6541.67	2025-05-31 09:34:31.929683	2024-06-14 09:34:31.929683	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 09:34:31.929683	2025-06-14 09:34:31.929683	auto_order
3	mohammad.retail@example.com	محمد	خرده‌فروش	فروشگاه مواد شیمیایی محمد	+98-51-33445566	\N	Iran	\N	Mashhad	\N	\N	\N	\N	\N	\N	retail	active	website	\N	3	15600.00	5200.00	2025-06-07 09:34:31.929683	2025-03-14 09:34:31.929683	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 09:34:31.929683	2025-06-14 09:34:31.929683	auto_order
4	sara.chemistry@example.com	سارا	شیمی	آزمایشگاه شیمی سارا	+98-21-55667788	\N	Iran	\N	Tehran	خیابان ولیعصر، پلاک 123	1234567890	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	2025-06-14 09:34:50.871	2025-06-14 09:34:50.871	2025-06-14 09:34:50.871	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 09:34:50.88302	2025-06-14 09:34:50.88302	auto_order
5	mr.ghafari@gmail.com	محمدرضا	غفاری	پتروشیمی شازند	09124955173	\N		\N		\N	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N		\N	t	2025-06-14 09:38:06.429023	2025-06-14 09:38:06.429023	admin
\.


--
-- Name: crm_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.crm_customers_id_seq', 5, true);


--
-- Name: crm_customers crm_customers_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crm_customers
    ADD CONSTRAINT crm_customers_email_key UNIQUE (email);


--
-- Name: crm_customers crm_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crm_customers
    ADD CONSTRAINT crm_customers_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

