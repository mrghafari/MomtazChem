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

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: neondb_owner
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: neondb_owner
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: neondb_owner
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: certifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.certifications (
    id integer NOT NULL,
    name character varying NOT NULL,
    issuer character varying NOT NULL,
    issue_date date,
    expiry_date date,
    description text,
    certificate_url character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.certifications OWNER TO neondb_owner;

--
-- Name: certifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.certifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.certifications_id_seq OWNER TO neondb_owner;

--
-- Name: certifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.certifications_id_seq OWNED BY public.certifications.id;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contacts (
    id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    company text,
    product_interest text,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contacts OWNER TO neondb_owner;

--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contacts_id_seq OWNER TO neondb_owner;

--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    company text,
    tax_id text,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    total_orders integer DEFAULT 0,
    total_spent numeric(12,2) DEFAULT 0,
    last_order_date timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customers OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: discount_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.discount_settings (
    id integer NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'quantity'::text NOT NULL,
    min_quantity integer NOT NULL,
    discount_percentage numeric(5,2) NOT NULL,
    is_active boolean DEFAULT true,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    applicable_products jsonb,
    apply_to_all_products boolean DEFAULT true,
    applicable_categories jsonb
);


ALTER TABLE public.discount_settings OWNER TO neondb_owner;

--
-- Name: discount_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.discount_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discount_settings_id_seq OWNER TO neondb_owner;

--
-- Name: discount_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.discount_settings_id_seq OWNED BY public.discount_settings.id;


--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.financial_transactions (
    id integer NOT NULL,
    type text NOT NULL,
    order_id integer,
    amount numeric(10,2) NOT NULL,
    description text NOT NULL,
    reference_number text,
    status text DEFAULT 'completed'::text NOT NULL,
    processing_date timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.financial_transactions OWNER TO neondb_owner;

--
-- Name: financial_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.financial_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financial_transactions_id_seq OWNER TO neondb_owner;

--
-- Name: financial_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.financial_transactions_id_seq OWNED BY public.financial_transactions.id;


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inventory_transactions (
    id integer NOT NULL,
    product_id integer NOT NULL,
    type text NOT NULL,
    quantity integer NOT NULL,
    reference_id integer,
    reference_type text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inventory_transactions OWNER TO neondb_owner;

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_transactions_id_seq OWNER TO neondb_owner;

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_activities (
    id integer NOT NULL,
    lead_id integer NOT NULL,
    activity_type text NOT NULL,
    subject text NOT NULL,
    description text,
    contact_method text,
    outcome text,
    duration integer,
    scheduled_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_by integer,
    attachments json,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lead_activities OWNER TO neondb_owner;

--
-- Name: lead_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.lead_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_activities_id_seq OWNER TO neondb_owner;

--
-- Name: lead_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.lead_activities_id_seq OWNED BY public.lead_activities.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    company text,
    job_title text,
    industry text,
    country text,
    city text,
    lead_source text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    product_interest text,
    estimated_value numeric(10,2),
    probability integer DEFAULT 25,
    expected_close_date timestamp without time zone,
    last_contact_date timestamp without time zone,
    next_follow_up_date timestamp without time zone,
    notes text,
    assigned_to integer,
    tags json,
    custom_fields json,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.leads OWNER TO neondb_owner;

--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leads_id_seq OWNER TO neondb_owner;

--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    product_name text NOT NULL,
    product_sku text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    product_snapshot json,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_items OWNER TO neondb_owner;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO neondb_owner;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


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
-- Name: password_resets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.password_resets OWNER TO neondb_owner;

--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_resets_id_seq OWNER TO neondb_owner;

--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    short_description text,
    price numeric(10,2),
    price_unit text,
    in_stock boolean DEFAULT true,
    stock_quantity integer DEFAULT 0,
    sku text,
    image_url text,
    pdf_catalog_url text,
    specifications json,
    features json,
    applications json,
    technical_data_sheet_url text,
    safety_data_sheet_url text,
    minimum_order_quantity integer,
    lead_time text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: sales_reports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales_reports (
    id integer NOT NULL,
    report_date timestamp without time zone NOT NULL,
    report_type text NOT NULL,
    total_sales numeric(12,2) DEFAULT 0 NOT NULL,
    total_refunds numeric(12,2) DEFAULT 0 NOT NULL,
    total_returns numeric(12,2) DEFAULT 0 NOT NULL,
    net_revenue numeric(12,2) DEFAULT 0 NOT NULL,
    order_count integer DEFAULT 0 NOT NULL,
    refund_count integer DEFAULT 0 NOT NULL,
    return_count integer DEFAULT 0 NOT NULL,
    average_order_value numeric(10,2) DEFAULT 0 NOT NULL,
    top_selling_products jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sales_reports OWNER TO neondb_owner;

--
-- Name: sales_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sales_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_reports_id_seq OWNER TO neondb_owner;

--
-- Name: sales_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sales_reports_id_seq OWNED BY public.sales_reports.id;


--
-- Name: shop_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shop_categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    parent_id integer,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    meta_title text,
    meta_description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.shop_categories OWNER TO neondb_owner;

--
-- Name: shop_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shop_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shop_categories_id_seq OWNER TO neondb_owner;

--
-- Name: shop_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shop_categories_id_seq OWNED BY public.shop_categories.id;


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
-- Name: showcase_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.showcase_products (
    id integer NOT NULL,
    name character varying NOT NULL,
    category character varying NOT NULL,
    description text NOT NULL,
    short_description text,
    price_range character varying,
    image_url character varying,
    pdf_catalog_url character varying,
    specifications jsonb DEFAULT '{}'::jsonb,
    features text[] DEFAULT '{}'::text[],
    applications text[] DEFAULT '{}'::text[],
    technical_data_sheet_url character varying,
    safety_data_sheet_url character varying,
    certifications text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    stock_quantity integer DEFAULT 0,
    min_stock_level integer DEFAULT 10,
    max_stock_level integer DEFAULT 1000,
    stock_unit text DEFAULT 'units'::text,
    inventory_status text DEFAULT 'in_stock'::text,
    last_restock_date timestamp without time zone,
    supplier text,
    warehouse_location text,
    batch_number text,
    expiry_date timestamp without time zone
);


ALTER TABLE public.showcase_products OWNER TO neondb_owner;

--
-- Name: showcase_products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.showcase_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.showcase_products_id_seq OWNER TO neondb_owner;

--
-- Name: showcase_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.showcase_products_id_seq OWNED BY public.showcase_products.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: certifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.certifications ALTER COLUMN id SET DEFAULT nextval('public.certifications_id_seq'::regclass);


--
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: discount_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.discount_settings ALTER COLUMN id SET DEFAULT nextval('public.discount_settings_id_seq'::regclass);


--
-- Name: financial_transactions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.financial_transactions ALTER COLUMN id SET DEFAULT nextval('public.financial_transactions_id_seq'::regclass);


--
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- Name: lead_activities id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_activities ALTER COLUMN id SET DEFAULT nextval('public.lead_activities_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: sales_reports id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_reports ALTER COLUMN id SET DEFAULT nextval('public.sales_reports_id_seq'::regclass);


--
-- Name: shop_categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_categories ALTER COLUMN id SET DEFAULT nextval('public.shop_categories_id_seq'::regclass);


--
-- Name: shop_products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_products ALTER COLUMN id SET DEFAULT nextval('public.shop_products_id_seq'::regclass);


--
-- Name: showcase_products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.showcase_products ALTER COLUMN id SET DEFAULT nextval('public.showcase_products_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: neondb_owner
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
\.


--
-- Data for Name: certifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.certifications (id, name, issuer, issue_date, expiry_date, description, certificate_url, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contacts (id, first_name, last_name, email, company, product_interest, message, created_at) FROM stdin;
1	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	water-treatment	hohioph9	2025-06-12 06:56:20.464957
2	Mohammadreza	Ghafari	mr.ghafari@gmail.com		paint-thinner	سشس	2025-06-12 07:26:34.792951
3	Mohammadreza	Ghafari	mr.ghafari@gmail.com	پتروشیمی شازند		adad	2025-06-12 07:42:36.624397
4	Mohammadreza	Ghafari	mr.ghafari@gmail.com	پتروشیمی شازند	paint-thinner	دزازل	2025-06-12 07:50:16.761076
5	Test	User	test@example.com	Test Company	Chemical Products	This is a test message	2025-06-13 05:00:43.915313
6	Test	User	test@example.com	Test Company	Chemical Products	This is a test message after fix	2025-06-13 05:01:18.62423
7	Test	User	test@example.com	Test Company	Chemical Products	This is a test message after restart	2025-06-13 05:01:29.019854
8	Test	User	test@example.com	Test Company	Chemical Products	Testing email functionality	2025-06-13 05:01:57.591776
9	تست	کاربر	test@example.com	شرکت تست	محصولات شیمیایی	این پیام تستی برای بررسی عملکرد ایمیل است	2025-06-13 05:04:23.482418
10	تست	جدید	test@example.com	شرکت تست	محصولات شیمیایی	تست ایمیل با تنظیمات جدید	2025-06-13 05:04:58.988405
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customers (id, email, first_name, last_name, phone, company, tax_id, is_verified, is_active, total_orders, total_spent, last_order_date, notes, created_at, updated_at) FROM stdin;
1	mr.ghafari@gmail.com	محمدرضا	غفاری	09124955173	پتروشیمی شازند	\N	f	t	5	2682.47	2025-06-13 04:11:44.042	\N	2025-06-13 01:59:12.524813	2025-06-13 04:11:44.042
\.


--
-- Data for Name: discount_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.discount_settings (id, name, type, min_quantity, discount_percentage, is_active, description, created_at, updated_at, applicable_products, apply_to_all_products, applicable_categories) FROM stdin;
1	Bulk Discount 10+	quantity	10	5.00	t	خرید عمده - 5% تخفیف برای 10 عدد یا بیشتر	2025-06-13 02:12:16.680539	2025-06-13 02:12:16.680539	\N	t	\N
2	Bulk Discount 25+	quantity	25	10.00	t	خرید عمده - 10% تخفیف برای 25 عدد یا بیشتر	2025-06-13 02:12:16.680539	2025-06-13 02:12:16.680539	\N	t	\N
3	Bulk Discount 50+	quantity	50	14.98	t	خرید عمده - 15% تخفیف برای 50 عدد یا بیشتر	2025-06-13 02:12:16.680539	2025-06-13 02:12:16.680539	[]	t	\N
\.


--
-- Data for Name: financial_transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.financial_transactions (id, type, order_id, amount, description, reference_number, status, processing_date, metadata, created_at) FROM stdin;
1	sale	2	185.56	Sale from order #ORD-1749780109958-4A2B7	ORD-1749780109958-4A2B7	completed	2025-06-11 02:25:42.682818	{"customerId": 1, "orderNumber": "ORD-1749780109958-4A2B7", "paymentStatus": "completed"}	2025-06-13 02:25:42.682818
2	sale	1	95.99	Sale from order #ORD-1749780109958-ABC12	ORD-1749780109958-ABC12	completed	2025-06-12 02:25:42.682818	{"customerId": 2, "orderNumber": "ORD-1749780109958-ABC12", "paymentStatus": "completed"}	2025-06-13 02:25:42.682818
3	refund	1	95.99	Customer refund - defective product	REF-1749781500001	completed	2025-06-12 14:25:42.682818	{"reason": "defective product", "originalOrderId": 1}	2025-06-13 02:25:42.682818
4	sale	\N	245.00	Direct sale - Diesel Anti-Gel Additive	DIRECT-1749781500002	completed	2025-06-12 20:25:42.682818	{"quantity": 5, "productId": 4, "directSale": true}	2025-06-13 02:25:42.682818
5	sale	\N	129.99	Direct sale - Premium Paint Thinner	DIRECT-1749781500003	completed	2025-06-12 23:25:42.682818	{"quantity": 2, "productId": 3, "directSale": true}	2025-06-13 02:25:42.682818
6	sale	3	1912.95	Sale from order #ORD-1749782065311-1RABJ	ORD-1749782065311-1RABJ	completed	2025-06-13 02:34:25.59	{"customerId": 1, "orderNumber": "ORD-1749782065311-1RABJ", "paymentStatus": "pending"}	2025-06-13 02:34:25.601714
7	sale	4	448.12	Sale from order #ORD-1749783637801-YJUS7	ORD-1749783637801-YJUS7	completed	2025-06-13 03:00:38.348	{"customerId": 1, "orderNumber": "ORD-1749783637801-YJUS7", "paymentStatus": "pending"}	2025-06-13 03:00:38.359073
8	sale	5	135.84	Sale from order #ORD-1749787903550-BKNM9	ORD-1749787903550-BKNM9	completed	2025-06-13 04:11:44.066	{"customerId": 1, "orderNumber": "ORD-1749787903550-BKNM9", "paymentStatus": "pending"}	2025-06-13 04:11:44.077263
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inventory_transactions (id, product_id, type, quantity, reference_id, reference_type, notes, created_at) FROM stdin;
1	1	adjustment	-1	\N	\N	Order ORD-1749779952414-NIOK3 - Sold 1 units	2025-06-13 01:59:12.675837
2	2	adjustment	-1	\N	\N	Order ORD-1749780109958-43Y4H - Sold 1 units	2025-06-13 02:01:50.118094
3	6	adjustment	-27	\N	\N	Order ORD-1749782065311-1RABJ - Sold 27 units	2025-06-13 02:34:25.55188
4	4	adjustment	-1	\N	\N	Order ORD-1749783637801-YJUS7 - Sold 1 units	2025-06-13 03:00:38.143295
5	15	adjustment	-7	\N	\N	Order ORD-1749783637801-YJUS7 - Sold 7 units	2025-06-13 03:00:38.308038
6	3	adjustment	-1	\N	\N	Order ORD-1749787903550-BKNM9 - Sold 1 units	2025-06-13 04:11:43.901072
7	14	adjustment	-1	\N	\N	Order ORD-1749787903550-BKNM9 - Sold 1 units	2025-06-13 04:11:44.030652
\.


--
-- Data for Name: lead_activities; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lead_activities (id, lead_id, activity_type, subject, description, contact_method, outcome, duration, scheduled_at, completed_at, created_by, attachments, created_at) FROM stdin;
1	1	call	Initial discovery call	Discussed current fuel additive usage and requirements. PetroTech processes 10,000 barrels daily and needs high-quality additives for efficiency improvement.	phone	positive	45	\N	2024-01-10 14:30:00	1	\N	2025-06-12 08:23:57.988249
2	1	email	Technical specifications sent	Forwarded detailed product specifications for DFA-100 diesel fuel additive including performance data and compatibility information.	email	neutral	\N	\N	2024-01-11 09:15:00	1	\N	2025-06-12 08:23:57.988249
3	2	meeting	Site visit and assessment	Conducted on-site evaluation of water treatment facility. Identified specific coagulant requirements for their municipal system serving 500,000 residents.	in_person	positive	120	\N	2024-01-08 10:00:00	1	\N	2025-06-12 08:23:57.988249
4	2	email	Custom proposal submitted	Sent detailed proposal for WTC-200 coagulant with customized specifications and pricing for annual contract.	email	positive	\N	\N	2024-01-12 16:45:00	1	\N	2025-06-12 08:23:57.988249
5	3	call	Contract negotiation call	Discussed terms for annual paint thinner supply contract. Negotiating volume discounts and delivery schedules.	phone	positive	60	\N	2024-01-09 11:00:00	1	\N	2025-06-12 08:23:57.988249
6	4	note	Referral received	Contact referred by existing customer Al-Najaf Agricultural Cooperative. Potential for large-scale fertilizer supply.	\N	positive	\N	\N	2024-01-05 08:30:00	1	\N	2025-06-12 08:23:57.988249
7	5	email	Distribution agreement discussion	Initial email exchange about becoming regional distributor for fuel additives across Texas and Louisiana markets.	email	positive	\N	\N	2024-01-07 13:20:00	1	\N	2025-06-12 08:23:57.988249
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.leads (id, first_name, last_name, email, phone, company, job_title, industry, country, city, lead_source, status, priority, product_interest, estimated_value, probability, expected_close_date, last_contact_date, next_follow_up_date, notes, assigned_to, tags, custom_fields, created_at, updated_at) FROM stdin;
1	Ahmed	Al-Rashid	ahmed.rashid@petrotech.iq	+964 750 123 4567	PetroTech Solutions	Operations Manager	Oil & Gas	Iraq	Baghdad	website	qualified	high	fuel-additives	50000.00	75	\N	\N	2024-01-15 00:00:00	Interested in bulk fuel additives for refinery operations. Follow up on pricing proposal.	\N	\N	\N	2025-06-12 08:23:45.408363	2025-06-12 08:23:45.408363
2	Sarah	Johnson	sarah.j@aquatech.com	+1 555 987 6543	AquaTech Industries	Chief Engineer	Water Treatment	USA	Houston	email	proposal	high	water-treatment	75000.00	60	\N	\N	2024-01-20 00:00:00	Large municipal water treatment project. Needs custom coagulant solution.	\N	\N	\N	2025-06-12 08:23:45.408363	2025-06-12 08:23:45.408363
3	Mohammad	Hassan	mhassan@kurdistan-paint.com	+964 770 555 1234	Kurdistan Paint Company	Procurement Head	Manufacturing	Iraq	Erbil	contact_form	negotiation	medium	paint-thinner	25000.00	80	\N	\N	2024-01-18 00:00:00	Regular supplier for paint thinner. Negotiating annual contract terms.	\N	\N	\N	2025-06-12 08:23:45.408363	2025-06-12 08:23:45.408363
4	Fatima	Al-Zahra	fatima@greenfields.iq	+964 751 777 8889	Green Fields Agriculture	Farm Manager	Agriculture	Iraq	Basra	referral	new	medium	agricultural-fertilizers	35000.00	25	\N	\N	2024-01-25 00:00:00	New contact from agricultural sector. Interested in NPK fertilizers for large farm operations.	\N	\N	\N	2025-06-12 08:23:45.408363	2025-06-12 08:23:45.408363
5	David	Miller	dmiller@chemcorp.com	+1 713 456 7890	ChemCorp Solutions	Purchasing Director	Chemical Distribution	USA	Dallas	phone	contacted	urgent	fuel-additives	120000.00	45	\N	\N	2024-01-22 00:00:00	Distributor looking for long-term fuel additive supply agreement. High volume potential.	\N	\N	\N	2025-06-12 08:23:45.408363	2025-06-12 08:23:45.408363
6	Mohammadreza	Ghafari	mr.ghafari@gmail.com		پتروشیمی شازند	\N	\N	\N	\N	contact_form	new	medium	paint-thinner	\N	25	\N	\N	\N	Converted from contact form. Original message: دزازل	\N	\N	\N	2025-06-12 09:09:56.638797	2025-06-12 09:09:56.638797
7	Ali	Hassan	ali.hassan@example.com	+964-770-123-4567	Baghdad Chemicals	Procurement Manager	\N	\N	\N	website	new	high	fuel-additives	\N	25	\N	\N	\N	Interested in bulk fuel additives for industrial use	\N	\N	\N	2025-06-12 09:17:38.872024	2025-06-12 09:17:38.872024
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, product_snapshot, created_at) FROM stdin;
1	1	1	Industrial Water Clarifier WC-500	WC-500-5L	1	45.99	45.99	\N	2025-06-13 01:59:12.580777
2	2	2	Pool Chlorine Stabilizer CS-100	CS-100-10KG	1	32.50	32.50	\N	2025-06-13 02:01:50.024598
3	3	6	NPK Fertilizer Complex 20-10-10	NPK-201010-25KG	27	65.00	1755.00	\N	2025-06-13 02:34:25.455692
4	4	4	Diesel Anti-Gel Additive DAG-Winter	DAG-WINTER-250ML	1	15.25	15.25	\N	2025-06-13 03:00:37.953535
5	4	15	Water Treatment Chemical A1	SP-2-WATER-TREA	7	50.00	350.00	\N	2025-06-13 03:00:38.187336
6	5	3	Fuel System Cleaner Premium FSC-Pro	FSC-PRO-500ML	1	28.75	28.75	\N	2025-06-13 04:11:43.781739
7	5	14	Fuel System Cleaner Pro	SP-1-FUEL-SYSTE	1	50.00	50.00	\N	2025-06-13 04:11:43.933498
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, order_number, customer_id, status, payment_status, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, currency, notes, billing_address, shipping_address, shipping_method, tracking_number, order_date, shipped_date, delivered_date, created_at, updated_at) FROM stdin;
5	ORD-1749787903550-BKNM9	1	delivered	pending	78.75	7.09	50.00	0.00	135.84	USD		{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	standard	\N	2025-06-13 04:11:43.719	\N	\N	2025-06-13 04:11:43.732826	2025-06-13 04:12:11.937
3	ORD-1749782065311-1RABJ	1	delivered	pending	1755.00	157.95	0.00	0.00	1912.95	USD		{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	standard	\N	2025-06-13 02:34:25.413	\N	\N	2025-06-13 02:34:25.425615	2025-06-13 02:59:28.89
1	ORD-1749779952414-NIOK3	1	delivered	pending	45.99	4.14	50.00	0.00	100.13	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	standard	\N	2025-06-13 01:59:12.544	\N	\N	2025-06-13 01:59:12.55602	2025-06-13 02:11:30.209
2	ORD-1749780109958-43Y4H	1	delivered	pending	32.50	2.93	50.00	0.00	85.43	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	express	\N	2025-06-13 02:01:49.981	\N	\N	2025-06-13 02:01:49.994158	2025-06-13 02:13:19.766
4	ORD-1749783637801-YJUS7	1	delivered	pending	365.25	32.87	50.00	0.00	448.12	USD		{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	express	\N	2025-06-13 03:00:37.907	\N	\N	2025-06-13 03:00:37.920409	2025-06-13 03:01:30.334
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.password_resets (id, email, token, expires_at, used, created_at) FROM stdin;
1	mr.ghafari@gmail.com	7cg50rc8hf8mbubblth	2025-06-13 05:33:38.357	t	2025-06-13 04:33:38.36964
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, name, category, description, short_description, price, price_unit, in_stock, stock_quantity, sku, image_url, pdf_catalog_url, specifications, features, applications, technical_data_sheet_url, safety_data_sheet_url, minimum_order_quantity, lead_time, is_active, created_at, updated_at) FROM stdin;
1	Diesel Fuel Additive DFA-100	fuel-additives	High-performance diesel fuel additive designed to improve fuel efficiency, reduce emissions, and enhance engine performance. Contains advanced detergent-dispersant technology and corrosion inhibitors.	Premium diesel additive for improved fuel efficiency and engine protection	25.50	per liter	t	150	DFA-100-1L	\N	\N	{"cetane_improver": "15-20 points", "detergent_level": "high", "corrosion_inhibitor": "included", "storage_stability": "24 months"}	["Improves fuel combustion", "Reduces emissions", "Prevents fuel system corrosion", "Enhances cold weather performance"]	["Heavy duty trucks", "Marine engines", "Industrial generators", "Agricultural machinery"]	\N	\N	20	5-7 days	t	2025-06-12 08:12:49.495726	2025-06-12 08:12:49.495726
2	Water Treatment Coagulant WTC-200	water-treatment	Polyaluminum chloride-based coagulant for municipal and industrial water treatment. Effective in removing suspended solids, turbidity, and organic contaminants from water sources.	Polyaluminum chloride coagulant for water purification	18.75	per kg	t	500	WTC-200-25KG	\N	\N	{"active_content": "30% Al2O3", "ph_range": "6.0-9.0", "solubility": "complete", "shelf_life": "18 months"}	["Fast coagulation", "Wide pH range", "Low residual aluminum", "Effective turbidity removal"]	["Municipal water treatment", "Industrial wastewater", "Swimming pool treatment", "Drinking water purification"]	\N	\N	50	3-5 days	t	2025-06-12 08:12:49.495726	2025-06-12 08:12:49.495726
3	Paint Thinner PT-300	paint-thinner	High-quality mineral spirits-based paint thinner suitable for oil-based paints, varnishes, and stains. Low odor formula with excellent solvency properties for professional and residential use.	Low-odor mineral spirits paint thinner for professional use	12.25	per liter	t	200	PT-300-4L	\N	\N	{"flash_point": "38°C", "distillation_range": "150-200°C", "aromatic_content": "<1%", "evaporation_rate": "medium"}	["Low odor formulation", "Excellent solvency", "Clean evaporation", "Professional grade"]	["Oil-based paints", "Varnishes and stains", "Equipment cleaning", "Paint preparation"]	\N	\N	12	2-4 days	t	2025-06-12 08:12:49.495726	2025-06-12 08:12:49.495726
4	NPK Fertilizer 20-20-20	agricultural-fertilizers	Balanced water-soluble NPK fertilizer with micronutrients. Ideal for field crops, greenhouse cultivation, and hydroponic systems. Contains chelated micronutrients for enhanced plant uptake.	Balanced NPK fertilizer with micronutrients for all crops	35.00	per 25kg bag	t	80	NPK-202020-25KG	\N	\N	{"nitrogen": "20%", "phosphorus": "20%", "potassium": "20%", "micronutrients": "chelated", "solubility": "100%"}	["Water soluble", "Balanced nutrition", "Chelated micronutrients", "Quick plant uptake"]	["Field crops", "Greenhouse cultivation", "Hydroponic systems", "Fruit and vegetables"]	\N	\N	10	7-10 days	t	2025-06-12 08:12:49.495726	2025-06-12 08:12:49.495726
5	Anuga	fuel-additives	DSF	SDFD	855.00	per liter	t	0				{}	[]	[]			1	7-14 days	t	2025-06-12 09:01:35.850415	2025-06-12 09:02:08.907
\.


--
-- Data for Name: sales_reports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales_reports (id, report_date, report_type, total_sales, total_refunds, total_returns, net_revenue, order_count, refund_count, return_count, average_order_value, top_selling_products, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shop_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shop_categories (id, name, slug, description, image_url, parent_id, is_active, display_order, meta_title, meta_description, created_at, updated_at) FROM stdin;
1	Water Treatment	water-treatment	Professional water treatment chemicals and solutions	\N	\N	t	1	\N	\N	2025-06-13 01:50:47.257527	2025-06-13 01:50:47.257527
2	Fuel Additives	fuel-additives	High-performance fuel system cleaners and additives	\N	\N	t	2	\N	\N	2025-06-13 01:50:47.257527	2025-06-13 01:50:47.257527
3	Paint & Solvents	paint-solvents	Industrial paint thinners and solvents	\N	\N	t	3	\N	\N	2025-06-13 01:50:47.257527	2025-06-13 01:50:47.257527
4	Agricultural	agricultural	Fertilizers and agricultural chemicals	\N	\N	t	4	\N	\N	2025-06-13 01:50:47.257527	2025-06-13 01:50:47.257527
\.


--
-- Data for Name: shop_products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shop_products (id, name, category, description, short_description, price, compare_at_price, price_unit, in_stock, stock_quantity, low_stock_threshold, sku, barcode, weight, weight_unit, dimensions, image_urls, thumbnail_url, specifications, features, applications, tags, minimum_order_quantity, maximum_order_quantity, lead_time, shipping_class, tax_class, is_active, is_featured, meta_title, meta_description, created_at, updated_at, quantity_discounts) FROM stdin;
5	Paint Thinner Professional PT-Grade	paint-solvents	High-quality paint thinner for professional painting applications. Fast-evaporating and residue-free.	Professional grade paint thinner	22.00	\N	per 1L	t	50	10	PT-GRADE-1L	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 01:50:58.996872	\N
12	Premium Paint Thinner	paint-thinner	Professional grade paint thinner for industrial use	\N	50.00	\N	unit	t	0	30	SP-3-PREMIUM-PA	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-13 09:33:14.967	\N
13	NPK Fertilizer Complex	agricultural-fertilizers	Balanced NPK fertilizer for optimal crop growth	\N	50.00	\N	unit	t	75	15	SP-4-NPK-FERTIL	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-13 09:33:15.016	\N
1	Industrial Water Clarifier WC-500	water-treatment	High-performance water clarifying agent for industrial applications. Removes suspended particles and turbidity effectively.	Professional water clarifier for industrial use	45.99	\N	per 5L	t	24	10	WC-500-5L	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 01:59:12.64	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
2	Pool Chlorine Stabilizer CS-100	water-treatment	Cyanuric acid-based stabilizer that protects chlorine from UV degradation in swimming pools and water systems.	UV-resistant chlorine stabilizer	32.50	\N	per 10kg	t	39	10	CS-100-10KG	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 02:01:50.083	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
6	NPK Fertilizer Complex 20-10-10	agricultural	Balanced NPK fertilizer with nitrogen, phosphorus, and potassium for optimal plant growth and yield.	Balanced NPK fertilizer complex	65.00	\N	per 25kg	t	-7	10	NPK-201010-25KG	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 02:34:25.517	[\n  {"minQty": 5, "discount": 0.03},\n  {"minQty": 20, "discount": 0.08},\n  {"minQty": 100, "discount": 0.20}\n]
3	Fuel System Cleaner Premium FSC-Pro	fuel-additives	Advanced fuel injector cleaner that removes carbon deposits and improves engine performance. Compatible with gasoline and diesel.	Premium fuel system cleaner	28.75	\N	per 500ml	t	59	10	FSC-PRO-500ML	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 04:11:43.856	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
14	Fuel System Cleaner Pro	fuel-additives	Advanced fuel system cleaner that removes deposits and improves engine performance	\N	50.00	\N	unit	t	150	20	SP-1-FUEL-SYSTE	\N	\N	kg	\N	["/uploads/images/product-1749748720927-790133957.png"]	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-13 09:33:15.063	\N
15	Water Treatment Chemical A1	water-treatment	High-quality water treatment solution for industrial applications	\N	50.00	\N	unit	t	16	25	SP-2-WATER-TREA	\N	\N	kg	\N	["/uploads/images/product-1749743089947-629563758.png"]	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-13 09:33:15.112	\N
4	Diesel Anti-Gel Additive DAG-Winter	fuel-additives	Prevents fuel gelling in cold weather conditions. Improves cold flow properties of diesel fuel.	Winter diesel anti-gel protection	15.25	\N	per 250ml	t	34	10	DAG-WINTER-250ML	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 03:00:38.078	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
\.


--
-- Data for Name: showcase_products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.showcase_products (id, name, category, description, short_description, price_range, image_url, pdf_catalog_url, specifications, features, applications, technical_data_sheet_url, safety_data_sheet_url, certifications, is_active, display_order, created_at, updated_at, stock_quantity, min_stock_level, max_stock_level, stock_unit, inventory_status, last_restock_date, supplier, warehouse_location, batch_number, expiry_date) FROM stdin;
3	Premium Paint Thinner	paint-thinner	Professional grade paint thinner for industrial use	Industrial paint thinner	Contact for pricing	\N	\N	{}	{}	{}	\N	\N	{}	t	3	2025-06-12 15:01:26.313404	2025-06-12 15:01:26.313404	0	30	200	liters	out_of_stock	\N	PaintTech Industries	Erbil Storage B	PT2024003	\N
4	NPK Fertilizer Complex	agricultural-fertilizers	Balanced NPK fertilizer for optimal crop growth	Balanced NPK fertilizer	Contact for pricing	\N	\N	{}	{}	{}	\N	\N	{}	t	4	2025-06-12 15:01:26.313404	2025-06-12 15:01:26.313404	75	15	400	kg	in_stock	\N	AgriChem Ltd	Erbil Main Warehouse	AG2024004	\N
1	Fuel System Cleaner Pro	fuel-additives	Advanced fuel system cleaner that removes deposits and improves engine performance	Professional grade fuel system cleaner	Contact for pricing	/uploads/images/product-1749748720927-790133957.png		\N	\N	\N			\N	t	1	2025-06-12 15:01:26.313404	2025-06-12 17:18:47.412	150	20	500	liters	in_stock	\N	ChemCorp Industries	Erbil Main Warehouse	FC2024001	\N
2	Water Treatment Chemical A1	water-treatment	High-quality water treatment solution for industrial applications	Industrial water treatment solution	Contact for pricing	/uploads/images/product-1749743089947-629563758.png	/uploads/catalogs/catalog-1749743157148-170362258.pdf	\N	\N	\N			\N	t	2	2025-06-12 15:01:26.313404	2025-06-13 02:52:54.678	16	25	300	liters	low_stock	\N	AquaTech Solutions	Erbil Main Warehouse	WT2024002	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
1	info@momtazchem.com	info@momtazchem.com	$2b$10$NuCM4wvumAvsHZHssIbrVuDz2rbvnoOJ007u2qOKZ07PvJE/7Y/ju	admin	t	2025-06-12 08:17:29.164005	2025-06-12 08:17:29.164005
2	mr.ghafari@gmail.com	mr.ghafari@gmail.com	$2b$10$TJxSF7dZFwF2iOCI2is/EO4ExLAlRA/0DzSTO9.EtuRZLh7tF1O1G	admin	t	2025-06-13 02:42:47.07026	2025-06-13 04:33:43.174
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: neondb_owner
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, false);


--
-- Name: certifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.certifications_id_seq', 1, false);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contacts_id_seq', 10, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customers_id_seq', 1, true);


--
-- Name: discount_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.discount_settings_id_seq', 3, true);


--
-- Name: financial_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.financial_transactions_id_seq', 8, true);


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 7, true);


--
-- Name: lead_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.lead_activities_id_seq', 7, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.leads_id_seq', 7, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.order_items_id_seq', 7, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.orders_id_seq', 5, true);


--
-- Name: password_resets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.password_resets_id_seq', 1, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.products_id_seq', 6, true);


--
-- Name: sales_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sales_reports_id_seq', 1, false);


--
-- Name: shop_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shop_categories_id_seq', 4, true);


--
-- Name: shop_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shop_products_id_seq', 15, true);


--
-- Name: showcase_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.showcase_products_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: discount_settings discount_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.discount_settings
    ADD CONSTRAINT discount_settings_pkey PRIMARY KEY (id);


--
-- Name: financial_transactions financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


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
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_token_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_token_key UNIQUE (token);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: sales_reports sales_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_reports
    ADD CONSTRAINT sales_reports_pkey PRIMARY KEY (id);


--
-- Name: shop_categories shop_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_categories
    ADD CONSTRAINT shop_categories_pkey PRIMARY KEY (id);


--
-- Name: shop_categories shop_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shop_categories
    ADD CONSTRAINT shop_categories_slug_key UNIQUE (slug);


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
-- Name: showcase_products showcase_products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.showcase_products
    ADD CONSTRAINT showcase_products_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: financial_transactions financial_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

