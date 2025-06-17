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
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: admin_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_permissions (
    id integer NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    module text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: admin_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_permissions_id_seq OWNED BY public.admin_permissions.id;


--
-- Name: admin_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_roles (
    id integer NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: admin_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_roles_id_seq OWNED BY public.admin_roles.id;


--
-- Name: certifications; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: certifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.certifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: certifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.certifications_id_seq OWNED BY public.certifications.id;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: crm_customers; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: crm_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: crm_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_customers_id_seq OWNED BY public.crm_customers.id;


--
-- Name: customer_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_activities (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    activity_type text NOT NULL,
    activity_data json,
    description text NOT NULL,
    performed_by text,
    related_order_id integer,
    related_inquiry_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_activities_id_seq OWNED BY public.customer_activities.id;


--
-- Name: customer_inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_inquiries (
    id integer NOT NULL,
    customer_id integer,
    inquiry_number text NOT NULL,
    type text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    category text,
    product_ids json,
    attachments json,
    contact_email text NOT NULL,
    contact_phone text,
    company text,
    assigned_to integer,
    response_time timestamp without time zone,
    resolved_at timestamp without time zone,
    customer_rating integer,
    customer_feedback text,
    internal_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_inquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_inquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_inquiries_id_seq OWNED BY public.customer_inquiries.id;


--
-- Name: customer_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_orders (
    id integer NOT NULL,
    order_number text NOT NULL,
    customer_id integer,
    total_amount numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    shipping_address jsonb,
    billing_address jsonb,
    notes text,
    guest_email text,
    guest_name text,
    tracking_number text,
    estimated_delivery timestamp without time zone,
    actual_delivery timestamp without time zone,
    internal_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    shipped_at timestamp without time zone,
    carrier text,
    delivered_at timestamp without time zone
);


--
-- Name: customer_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_orders_id_seq OWNED BY public.customer_orders.id;


--
-- Name: customer_segments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_segments (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    criteria json,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_segments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_segments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_segments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_segments_id_seq OWNED BY public.customer_segments.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
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
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    password_hash text,
    country text,
    city text,
    address text,
    postal_code text,
    email_verified boolean DEFAULT false,
    verification_token text,
    reset_password_token text,
    reset_password_expires timestamp without time zone
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: discount_settings; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: discount_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discount_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: discount_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discount_settings_id_seq OWNED BY public.discount_settings.id;


--
-- Name: email_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_categories (
    id integer NOT NULL,
    category_key text NOT NULL,
    category_name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_categories_id_seq OWNED BY public.email_categories.id;


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id integer NOT NULL,
    category_id integer,
    template_id integer,
    smtp_id integer,
    to_email text NOT NULL,
    from_email text NOT NULL,
    subject text NOT NULL,
    status text NOT NULL,
    error_message text,
    sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_logs_id_seq OWNED BY public.email_logs.id;


--
-- Name: email_recipients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_recipients (
    id integer NOT NULL,
    category_id integer,
    email text NOT NULL,
    name text,
    is_primary boolean DEFAULT false,
    is_active boolean DEFAULT true,
    receive_types text[],
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_recipients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_recipients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_recipients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_recipients_id_seq OWNED BY public.email_recipients.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    subject text NOT NULL,
    html_content text NOT NULL,
    text_content text,
    variables json,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    language text DEFAULT 'en'::text NOT NULL,
    created_by integer NOT NULL,
    usage_count integer DEFAULT 0,
    last_used timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: equipment_maintenance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_maintenance (
    id integer NOT NULL,
    equipment_name text NOT NULL,
    equipment_code text,
    production_line_id integer,
    maintenance_type text NOT NULL,
    scheduled_date timestamp without time zone,
    completed_date timestamp without time zone,
    status text DEFAULT 'scheduled'::text,
    technician_name text,
    description text,
    cost numeric(10,2),
    downtime_hours numeric(5,2),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT equipment_maintenance_maintenance_type_check CHECK ((maintenance_type = ANY (ARRAY['preventive'::text, 'corrective'::text, 'emergency'::text]))),
    CONSTRAINT equipment_maintenance_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: equipment_maintenance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_maintenance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_maintenance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_maintenance_id_seq OWNED BY public.equipment_maintenance.id;


--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: financial_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.financial_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: financial_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.financial_transactions_id_seq OWNED BY public.financial_transactions.id;


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_movements (
    id integer NOT NULL,
    raw_material_id integer,
    movement_type text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit text NOT NULL,
    reference_id integer,
    reference_type text,
    movement_date timestamp without time zone DEFAULT now(),
    notes text,
    performed_by text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT inventory_movements_movement_type_check CHECK ((movement_type = ANY (ARRAY['purchase'::text, 'consumption'::text, 'adjustment'::text, 'waste'::text, 'transfer'::text])))
);


--
-- Name: inventory_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_movements_id_seq OWNED BY public.inventory_movements.id;


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: lead_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lead_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lead_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lead_activities_id_seq OWNED BY public.lead_activities.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer,
    product_name text NOT NULL,
    product_sku text NOT NULL,
    quantity numeric(10,3) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    product_snapshot json,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    unit text DEFAULT 'units'::text NOT NULL,
    specifications json,
    notes text
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: procedure_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedure_categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    color_code text DEFAULT '#3b82f6'::text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: procedure_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedure_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: procedure_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procedure_categories_id_seq OWNED BY public.procedure_categories.id;


--
-- Name: procedure_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedure_documents (
    id integer NOT NULL,
    procedure_id integer,
    outline_id integer,
    title text NOT NULL,
    description text,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    file_type text,
    upload_date timestamp without time zone DEFAULT now(),
    uploaded_by integer,
    version text DEFAULT '1.0'::text,
    is_active boolean DEFAULT true,
    download_count integer DEFAULT 0,
    last_downloaded_at timestamp without time zone,
    tags text[],
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    document_type character varying(50) DEFAULT 'procedure'::character varying
);


--
-- Name: procedure_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedure_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: procedure_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procedure_documents_id_seq OWNED BY public.procedure_documents.id;


--
-- Name: procedure_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedure_feedback (
    id integer NOT NULL,
    procedure_id integer,
    user_id integer,
    rating integer,
    comment text,
    suggestions text,
    is_helpful boolean,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT procedure_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: procedure_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedure_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: procedure_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procedure_feedback_id_seq OWNED BY public.procedure_feedback.id;


--
-- Name: procedure_outlines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedure_outlines (
    id integer NOT NULL,
    procedure_id integer,
    parent_id integer,
    level integer DEFAULT 1 NOT NULL,
    order_number integer NOT NULL,
    title text NOT NULL,
    content text,
    is_collapsible boolean DEFAULT true,
    is_expanded boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: procedure_outlines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedure_outlines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: procedure_outlines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procedure_outlines_id_seq OWNED BY public.procedure_outlines.id;


--
-- Name: procedure_revisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedure_revisions (
    id integer NOT NULL,
    procedure_id integer,
    version text NOT NULL,
    changes_summary text,
    content text NOT NULL,
    revised_by integer,
    revision_date timestamp without time zone DEFAULT now(),
    reason text
);


--
-- Name: procedure_revisions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedure_revisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: procedure_revisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procedure_revisions_id_seq OWNED BY public.procedure_revisions.id;


--
-- Name: procedure_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedure_steps (
    id integer NOT NULL,
    procedure_id integer,
    step_number integer NOT NULL,
    title text NOT NULL,
    description text,
    instructions text NOT NULL,
    estimated_time integer,
    required_tools text[],
    safety_notes text,
    quality_checkpoints text[],
    attachments jsonb DEFAULT '[]'::jsonb,
    is_critical boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: procedure_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedure_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: procedure_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procedure_steps_id_seq OWNED BY public.procedure_steps.id;


--
-- Name: procedure_training; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedure_training (
    id integer NOT NULL,
    procedure_id integer,
    user_id integer,
    training_date date,
    trainer_id integer,
    completion_status text DEFAULT 'pending'::text,
    test_score numeric(5,2),
    certification_date date,
    expiry_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT procedure_training_completion_status_check CHECK ((completion_status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: procedure_training_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedure_training_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: procedure_training_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procedure_training_id_seq OWNED BY public.procedure_training.id;


--
-- Name: procedures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedures (
    id integer NOT NULL,
    title text NOT NULL,
    category_id integer,
    description text,
    content text NOT NULL,
    version text DEFAULT '1.0'::text,
    status text DEFAULT 'draft'::text,
    priority text DEFAULT 'normal'::text,
    language text DEFAULT 'fa'::text,
    author_id integer,
    approver_id integer,
    approved_at timestamp without time zone,
    effective_date date,
    review_date date,
    tags text[],
    attachments jsonb DEFAULT '[]'::jsonb,
    access_level text DEFAULT 'public'::text,
    view_count integer DEFAULT 0,
    last_viewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT procedures_access_level_check CHECK ((access_level = ANY (ARRAY['public'::text, 'internal'::text, 'restricted'::text, 'confidential'::text]))),
    CONSTRAINT procedures_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT procedures_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'review'::text, 'approved'::text, 'archived'::text])))
);


--
-- Name: procedures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: procedures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procedures_id_seq OWNED BY public.procedures.id;


--
-- Name: production_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production_lines (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    capacity_per_hour integer DEFAULT 100,
    status text DEFAULT 'active'::text,
    location text,
    supervisor_name text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT production_lines_status_check CHECK ((status = ANY (ARRAY['active'::text, 'maintenance'::text, 'inactive'::text])))
);


--
-- Name: production_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.production_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: production_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.production_lines_id_seq OWNED BY public.production_lines.id;


--
-- Name: production_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production_orders (
    id integer NOT NULL,
    order_number text NOT NULL,
    product_name text NOT NULL,
    quantity_planned numeric(10,2) NOT NULL,
    quantity_produced numeric(10,2) DEFAULT 0,
    unit text NOT NULL,
    production_line_id integer,
    status text DEFAULT 'pending'::text,
    priority text DEFAULT 'normal'::text,
    planned_start_date timestamp without time zone,
    actual_start_date timestamp without time zone,
    planned_end_date timestamp without time zone,
    actual_end_date timestamp without time zone,
    supervisor_notes text,
    quality_check_status text DEFAULT 'pending'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT production_orders_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT production_orders_quality_check_status_check CHECK ((quality_check_status = ANY (ARRAY['pending'::text, 'passed'::text, 'failed'::text, 'in_review'::text]))),
    CONSTRAINT production_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'on_hold'::text])))
);


--
-- Name: production_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.production_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: production_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.production_orders_id_seq OWNED BY public.production_orders.id;


--
-- Name: production_recipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production_recipes (
    id integer NOT NULL,
    product_name text NOT NULL,
    raw_material_id integer,
    quantity_required numeric(10,2) NOT NULL,
    unit text NOT NULL,
    step_number integer NOT NULL,
    instructions text,
    temperature numeric(5,2),
    pressure numeric(5,2),
    mixing_time integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: production_recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.production_recipes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: production_recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.production_recipes_id_seq OWNED BY public.production_recipes.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: quality_control; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quality_control (
    id integer NOT NULL,
    production_order_id integer,
    test_type text NOT NULL,
    test_result text,
    test_value numeric(10,2),
    acceptable_range text,
    test_status text DEFAULT 'pending'::text,
    tested_by text,
    test_date timestamp without time zone DEFAULT now(),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT quality_control_test_status_check CHECK ((test_status = ANY (ARRAY['pending'::text, 'passed'::text, 'failed'::text])))
);


--
-- Name: quality_control_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quality_control_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quality_control_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quality_control_id_seq OWNED BY public.quality_control.id;


--
-- Name: raw_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.raw_materials (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    unit text NOT NULL,
    current_stock numeric(10,2) DEFAULT 0,
    minimum_stock numeric(10,2) DEFAULT 0,
    maximum_stock numeric(10,2) DEFAULT 1000,
    unit_price numeric(10,2),
    supplier text,
    storage_location text,
    expiry_date date,
    quality_grade text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: raw_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.raw_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: raw_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.raw_materials_id_seq OWNED BY public.raw_materials.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer,
    permission_id integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: safety_protocols; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.safety_protocols (
    id integer NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    description text,
    severity_level text DEFAULT 'medium'::text,
    required_ppe text[],
    emergency_contacts jsonb DEFAULT '[]'::jsonb,
    procedures text NOT NULL,
    first_aid_steps text,
    evacuation_plan text,
    is_mandatory boolean DEFAULT true,
    compliance_notes text,
    last_updated_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT safety_protocols_severity_level_check CHECK ((severity_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);


--
-- Name: safety_protocols_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.safety_protocols_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: safety_protocols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.safety_protocols_id_seq OWNED BY public.safety_protocols.id;


--
-- Name: sales_reports; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sales_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_reports_id_seq OWNED BY public.sales_reports.id;


--
-- Name: shop_categories; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: shop_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shop_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shop_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shop_categories_id_seq OWNED BY public.shop_categories.id;


--
-- Name: shop_products; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: shop_products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shop_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shop_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shop_products_id_seq OWNED BY public.shop_products.id;


--
-- Name: showcase_products; Type: TABLE; Schema: public; Owner: -
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
    expiry_date timestamp without time zone,
    barcode text,
    qr_code text,
    sku text
);


--
-- Name: showcase_products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.showcase_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: showcase_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.showcase_products_id_seq OWNED BY public.showcase_products.id;


--
-- Name: smtp_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.smtp_settings (
    id integer NOT NULL,
    category_id integer,
    host text NOT NULL,
    port integer NOT NULL,
    secure boolean DEFAULT false,
    username text NOT NULL,
    password text NOT NULL,
    from_name text NOT NULL,
    from_email text NOT NULL,
    is_active boolean DEFAULT true,
    test_status text DEFAULT 'untested'::text,
    last_tested timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: smtp_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.smtp_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: smtp_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.smtp_settings_id_seq OWNED BY public.smtp_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    role_id integer,
    last_login_at timestamp without time zone
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: admin_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_permissions ALTER COLUMN id SET DEFAULT nextval('public.admin_permissions_id_seq'::regclass);


--
-- Name: admin_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_roles ALTER COLUMN id SET DEFAULT nextval('public.admin_roles_id_seq'::regclass);


--
-- Name: certifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications ALTER COLUMN id SET DEFAULT nextval('public.certifications_id_seq'::regclass);


--
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: crm_customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_customers ALTER COLUMN id SET DEFAULT nextval('public.crm_customers_id_seq'::regclass);


--
-- Name: customer_activities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_activities ALTER COLUMN id SET DEFAULT nextval('public.customer_activities_id_seq'::regclass);


--
-- Name: customer_inquiries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_inquiries ALTER COLUMN id SET DEFAULT nextval('public.customer_inquiries_id_seq'::regclass);


--
-- Name: customer_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_orders ALTER COLUMN id SET DEFAULT nextval('public.customer_orders_id_seq'::regclass);


--
-- Name: customer_segments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_segments ALTER COLUMN id SET DEFAULT nextval('public.customer_segments_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: discount_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_settings ALTER COLUMN id SET DEFAULT nextval('public.discount_settings_id_seq'::regclass);


--
-- Name: email_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_categories ALTER COLUMN id SET DEFAULT nextval('public.email_categories_id_seq'::regclass);


--
-- Name: email_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs ALTER COLUMN id SET DEFAULT nextval('public.email_logs_id_seq'::regclass);


--
-- Name: email_recipients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_recipients ALTER COLUMN id SET DEFAULT nextval('public.email_recipients_id_seq'::regclass);


--
-- Name: email_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: equipment_maintenance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_maintenance ALTER COLUMN id SET DEFAULT nextval('public.equipment_maintenance_id_seq'::regclass);


--
-- Name: financial_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions ALTER COLUMN id SET DEFAULT nextval('public.financial_transactions_id_seq'::regclass);


--
-- Name: inventory_movements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements ALTER COLUMN id SET DEFAULT nextval('public.inventory_movements_id_seq'::regclass);


--
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- Name: lead_activities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities ALTER COLUMN id SET DEFAULT nextval('public.lead_activities_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: procedure_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_categories ALTER COLUMN id SET DEFAULT nextval('public.procedure_categories_id_seq'::regclass);


--
-- Name: procedure_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_documents ALTER COLUMN id SET DEFAULT nextval('public.procedure_documents_id_seq'::regclass);


--
-- Name: procedure_feedback id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_feedback ALTER COLUMN id SET DEFAULT nextval('public.procedure_feedback_id_seq'::regclass);


--
-- Name: procedure_outlines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_outlines ALTER COLUMN id SET DEFAULT nextval('public.procedure_outlines_id_seq'::regclass);


--
-- Name: procedure_revisions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_revisions ALTER COLUMN id SET DEFAULT nextval('public.procedure_revisions_id_seq'::regclass);


--
-- Name: procedure_steps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_steps ALTER COLUMN id SET DEFAULT nextval('public.procedure_steps_id_seq'::regclass);


--
-- Name: procedure_training id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_training ALTER COLUMN id SET DEFAULT nextval('public.procedure_training_id_seq'::regclass);


--
-- Name: procedures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures ALTER COLUMN id SET DEFAULT nextval('public.procedures_id_seq'::regclass);


--
-- Name: production_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_lines ALTER COLUMN id SET DEFAULT nextval('public.production_lines_id_seq'::regclass);


--
-- Name: production_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_orders ALTER COLUMN id SET DEFAULT nextval('public.production_orders_id_seq'::regclass);


--
-- Name: production_recipes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_recipes ALTER COLUMN id SET DEFAULT nextval('public.production_recipes_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: quality_control id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_control ALTER COLUMN id SET DEFAULT nextval('public.quality_control_id_seq'::regclass);


--
-- Name: raw_materials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raw_materials ALTER COLUMN id SET DEFAULT nextval('public.raw_materials_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: safety_protocols id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_protocols ALTER COLUMN id SET DEFAULT nextval('public.safety_protocols_id_seq'::regclass);


--
-- Name: sales_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_reports ALTER COLUMN id SET DEFAULT nextval('public.sales_reports_id_seq'::regclass);


--
-- Name: shop_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_categories ALTER COLUMN id SET DEFAULT nextval('public.shop_categories_id_seq'::regclass);


--
-- Name: shop_products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_products ALTER COLUMN id SET DEFAULT nextval('public.shop_products_id_seq'::regclass);


--
-- Name: showcase_products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.showcase_products ALTER COLUMN id SET DEFAULT nextval('public.showcase_products_id_seq'::regclass);


--
-- Name: smtp_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smtp_settings ALTER COLUMN id SET DEFAULT nextval('public.smtp_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
\.


--
-- Data for Name: admin_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_permissions (id, name, display_name, description, module, is_active, created_at) FROM stdin;
1	manage_users	مدیریت کاربران	ایجاد، ویرایش و حذف کاربران ادمین	users	t	2025-06-14 11:19:42.724256
2	manage_roles	مدیریت نقش‌ها	تعریف و تغییر نقش‌ها و دسترسی‌ها	users	t	2025-06-14 11:19:42.724256
3	view_system_logs	مشاهده لاگ‌های سیستم	دسترسی به لاگ‌ها و عملکرد سیستم	system	t	2025-06-14 11:19:42.724256
4	manage_database	مدیریت دیتابیس	بک‌آپ، بازیابی و مدیریت دیتابیس	system	t	2025-06-14 11:19:42.724256
5	manage_products	مدیریت محصولات	افزودن، ویرایش و حذف محصولات	products	t	2025-06-14 11:19:42.724256
6	view_products	مشاهده محصولات	مشاهده لیست محصولات	products	t	2025-06-14 11:19:42.724256
7	manage_categories	مدیریت دسته‌بندی‌ها	مدیریت دسته‌بندی محصولات	products	t	2025-06-14 11:19:42.724256
8	manage_inventory	مدیریت موجودی	کنترل موجودی و انبار	products	t	2025-06-14 11:19:42.724256
9	manage_customers	مدیریت مشتریان	افزودن، ویرایش مشتریان	crm	t	2025-06-14 11:19:42.724256
10	view_customers	مشاهده مشتریان	مشاهده اطلاعات مشتریان	crm	t	2025-06-14 11:19:42.724256
11	manage_inquiries	مدیریت استعلامات	پاسخ به استعلامات مشتریان	crm	t	2025-06-14 11:19:42.724256
12	view_customer_analytics	آمار مشتریان	مشاهده آمار و گزارش مشتریان	crm	t	2025-06-14 11:19:42.724256
13	manage_shop_products	مدیریت محصولات فروشگاه	مدیریت محصولات فروشگاه آنلاین	shop	t	2025-06-14 11:19:42.724256
14	manage_orders	مدیریت سفارشات	پردازش و مدیریت سفارشات	shop	t	2025-06-14 11:19:42.724256
15	view_sales	مشاهده فروش	مشاهده گزارش فروش	shop	t	2025-06-14 11:19:42.724256
16	manage_discounts	مدیریت تخفیف‌ها	ایجاد و مدیریت کدهای تخفیف	shop	t	2025-06-14 11:19:42.724256
17	view_analytics	مشاهده گزارش‌ها	دسترسی به آمار و گزارش‌ها	analytics	t	2025-06-14 11:19:42.724256
18	export_reports	خروجی گزارش‌ها	دانلود و صادرات گزارش‌ها	analytics	t	2025-06-14 11:19:42.724256
19	view_financial_reports	گزارش‌های مالی	مشاهده گزارش‌های مالی	analytics	t	2025-06-14 11:19:42.724256
20	manage_content	مدیریت محتوا	ویرایش صفحات و محتوای سایت	content	t	2025-06-14 11:19:42.724256
21	manage_specialists	مدیریت متخصصین	مدیریت اطلاعات متخصصین	content	t	2025-06-14 11:19:42.724256
22	manage_email_templates	مدیریت قالب‌های ایمیل	ایجاد و ویرایش قالب‌های ایمیل	content	t	2025-06-14 11:19:42.724256
\.


--
-- Data for Name: admin_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_roles (id, name, display_name, description, is_active, created_at, updated_at) FROM stdin;
1	super_admin	سوپر ادمین	دسترسی کامل به تمام بخش‌های سیستم	t	2025-06-14 11:19:26.449097	2025-06-14 11:19:26.449097
2	products_admin	مدیر محصولات	مدیریت محصولات و کاتالوگ	t	2025-06-14 11:19:26.449097	2025-06-14 11:19:26.449097
3	crm_admin	مدیر CRM	مدیریت مشتریان و فروش	t	2025-06-14 11:19:26.449097	2025-06-14 11:19:26.449097
4	shop_admin	مدیر فروشگاه	مدیریت فروشگاه آنلاین	t	2025-06-14 11:19:26.449097	2025-06-14 11:19:26.449097
5	analytics_admin	مدیر گزارش‌گیری	دسترسی به گزارش‌ها و آمار	t	2025-06-14 11:19:26.449097	2025-06-14 11:19:26.449097
6	content_admin	مدیر محتوا	مدیریت محتوا و صفحات سایت	t	2025-06-14 11:19:26.449097	2025-06-14 11:19:26.449097
\.


--
-- Data for Name: certifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certifications (id, name, issuer, issue_date, expiry_date, description, certificate_url, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: -
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
11	احمد	محمدی	ahmad@test.com	شرکت تست	fuel-additives	سلام، درباره محصولات شما سوال دارم	2025-06-14 08:34:12.323214
12	علی	احمدی	ali@test.com	شرکت آزمایش	water-treatment	سلام، درباره محصولات تصفیه آب سوال دارم	2025-06-14 08:34:43.21028
13	Test	User	test@example.com	Test Company	fuel-additives	Testing the contact form functionality	2025-06-14 08:37:16.761265
14	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	paint-thinner	ger	2025-06-14 09:04:32.897992
15	تست	کاربر	test@example.com	شرکت تست	chemicals	پیام تست	2025-06-14 09:08:31.546535
16	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	agricultural-fertilizers	سسبسبسبسس یرر	2025-06-14 09:08:48.130172
17	تست	CC	test.cc@example.com	شرکت تست	chemicals	تست CC	2025-06-14 09:09:16.424633
18	علی	احمدی	ali.ahmadi@test.com	شرکت پتروشیمی	industrial-solvents	درخواست قیمت حلال‌های صنعتی	2025-06-14 09:09:40.574825
19	علی	احمدی	ali.ahmadi@test.com	شرکت پتروشیمی	industrial-solvents	درخواست قیمت حلال‌های صنعتی	2025-06-14 09:10:01.840291
20	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	paint-thinner	یلتل	2025-06-14 09:11:20.15655
21	تست	نهایی	test.final@example.com	شرکت تست	chemicals	تست بدون خطای Invalid Recipients	2025-06-14 09:15:06.023321
22	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	paint-thinner	سلام	2025-06-14 09:15:52.088653
23	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	water-treatment	تست 2	2025-06-14 09:17:59.506034
24	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	agricultural-fertilizers	لطفا قیمت کالا را برا 3 تن اعلام کنید	2025-06-14 09:24:55.293072
25	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	paint-thinner	با	2025-06-14 09:41:35.661548
26	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	water-treatment	قلفق	2025-06-14 14:20:23.248239
27	Mohammadreza	Ghafari			water-treatment	یلشیل	2025-06-14 15:00:07.59671
28	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	water-treatment	ظبلدظبلدظبلدبل بلابظبدبی	2025-06-16 13:54:58.621681
29	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	fuel-additives	لتُبغفدسبلشذنکسد	2025-06-16 19:13:00.798423
\.


--
-- Data for Name: crm_customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.crm_customers (id, email, first_name, last_name, company, phone, alternate_phone, country, state, city, address, postal_code, industry, business_type, company_size, annual_revenue, customer_type, customer_status, customer_source, assigned_sales_rep, total_orders_count, total_spent, average_order_value, last_order_date, first_order_date, last_contact_date, next_follow_up_date, communication_preference, preferred_language, marketing_consent, product_interests, price_range, order_frequency, credit_limit, payment_terms, preferred_payment_method, credit_status, tags, internal_notes, public_notes, is_active, created_at, updated_at, created_by) FROM stdin;
4	sara.chemistry@example.com	سارا	شیمی	آزمایشگاه شیمی سارا	+98-21-55667788	\N	Iran	\N	Tehran	خیابان ولیعصر، پلاک 123	1234567890	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	2025-06-14 09:34:50.871	2025-06-14 09:34:50.871	2025-06-14 09:34:50.871	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 09:34:50.88302	2025-06-14 09:34:50.88302	auto_order
7	reovo.ir@gmail.com	شکوفه	غفاری	\N	\N	\N	Iran	\N	تویسرکان	تویسرکان،خیابان حافظ شرقی جنب خدمات کامپیوتری گرین کد پستی 6581813674	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	2025-06-15 11:49:23.473	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-15 11:46:39.982535	2025-06-15 11:49:23.473	system
6	mr.ghafari@yahoo.com	محمدرضا	غفاری	پتروشیمی شازند	09124955173	\N	Iran	\N	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	2025-06-14 15:49:50.936	2025-06-14 15:49:50.936	2025-06-17 18:08:03.269	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 15:32:26.316294	2025-06-17 18:08:03.269	system
1	ahmad.petrochemical@example.com	احمد	پتروشیمی	شرکت پتروشیمی ایران	+98-21-88776655	\N	Iran	\N	Tehran	\N	\N	\N	\N	\N	\N	b2b	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 09:34:31.929683	2025-06-14 09:34:31.929683	auto_order
2	fateme.distribution@example.com	فاطمه	توزیع	شرکت توزیع مواد شیمیایی	+98-31-77889900	\N	Iran	\N	Isfahan	\N	\N	\N	\N	\N	\N	distributor	active	referral	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 09:34:31.929683	2025-06-14 09:34:31.929683	auto_order
3	mohammad.retail@example.com	محمد	خرده‌فروش	فروشگاه مواد شیمیایی محمد	+98-51-33445566	\N	Iran	\N	Mashhad	\N	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 09:34:31.929683	2025-06-14 09:34:31.929683	auto_order
5	mr.ghafari@gmail.com	محمدرضا	غفاری	پتروشیمی شازند	09124955173	\N	Iran	\N	TEHRAN	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran	1968913751	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	2025-06-15 11:29:08.239	2025-06-14 14:23:39.353	2025-06-15 11:29:08.504	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N		\N	t	2025-06-14 09:38:06.429023	2025-06-15 11:29:08.504	admin
\.


--
-- Data for Name: customer_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_activities (id, customer_id, activity_type, activity_data, description, performed_by, related_order_id, related_inquiry_id, created_at) FROM stdin;
1	1	customer_created	{"source": "website"}	Customer احمد پتروشیمی was created	auto_order	\N	\N	2025-06-14 09:34:40.832803
2	1	order_placed	{"orderValue": 9000, "orderCount": 5}	Order placed for $9000.00	system	\N	\N	2025-06-14 09:34:40.832803
3	2	customer_created	{"source": "referral"}	Customer فاطمه توزیع was created	auto_order	\N	\N	2025-06-14 09:34:40.832803
4	2	order_placed	{"orderValue": 6541.67, "orderCount": 12}	Order placed for $6541.67	system	\N	\N	2025-06-14 09:34:40.832803
5	3	customer_created	{"source": "website"}	Customer محمد خرده‌فروش was created	auto_order	\N	\N	2025-06-14 09:34:40.832803
6	3	order_placed	{"orderValue": 5200, "orderCount": 3}	Order placed for $5200.00	system	\N	\N	2025-06-14 09:34:40.832803
7	1	email_sent	{"emailType": "welcome", "template": "customer_welcome"}	Welcome email sent to customer	system	\N	\N	2025-06-14 09:34:40.832803
8	2	call_made	{"duration": "15 minutes", "outcome": "interested"}	Follow-up call regarding bulk order discount	admin	\N	\N	2025-06-14 09:34:40.832803
9	3	inquiry_submitted	{"inquiryType": "product_info", "category": "water_treatment"}	Customer submitted inquiry about water treatment products	system	\N	\N	2025-06-14 09:34:40.832803
10	4	customer_created	{"source":"website"}	Customer سارا شیمی was created	auto_order	\N	\N	2025-06-14 09:34:50.91192
11	4	first_order	{"orderValue":2525,"isFirstOrder":true}	First order placed for $2525.00	system	\N	\N	2025-06-14 09:34:50.935121
12	5	customer_created	{"source":"website"}	Customer محمدرضا غفاری was created	admin	\N	\N	2025-06-14 09:38:06.456893
13	5	customer_updated	{"updatedFields":["firstName","lastName","company","phone","country","city","address","postalCode","lastOrderDate","firstOrderDate","lastContactDate"]}	Customer information was updated	admin	\N	\N	2025-06-14 14:23:39.386399
14	5	order_placed	{"orderValue":104.5,"orderCount":1}	Order placed for $104.50	system	\N	\N	2025-06-14 14:23:39.411828
15	6	customer_created	{}	Customer محمدرضا غفاری was created	system	\N	\N	2025-06-14 15:32:26.340262
16	6	registration	{"source":"website","registrationDate":"2025-06-14T15:32:26.354Z"}	مشتری در فروشگاه آنلاین ثبت نام کرد	\N	\N	\N	2025-06-14 15:32:26.363953
17	6	login	{"source":"website","loginDate":"2025-06-14T15:32:34.099Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 15:32:34.109257
18	6	login	{"source":"website","loginDate":"2025-06-14T15:36:32.555Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 15:36:32.567793
19	6	login	{"source":"website","loginDate":"2025-06-14T15:38:35.258Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 15:38:35.270823
20	6	login	{"source":"website","loginDate":"2025-06-14T15:48:07.609Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 15:48:07.620109
21	6	customer_updated	{"updatedFields":["firstName","lastName","company","phone","country","city","address","postalCode","lastOrderDate","firstOrderDate","lastContactDate"]}	Customer information was updated	admin	\N	\N	2025-06-14 15:49:50.967712
22	6	order_placed	{"orderValue":50,"orderCount":1}	Order placed for $50.00	system	\N	\N	2025-06-14 15:49:50.995153
23	6	order_placed	{"orderId":6,"totalAmount":50,"itemCount":1,"source":"website","orderDate":"2025-06-14T15:49:51.135Z"}	سفارش جدید به مبلغ $50 ثبت شد	\N	6	\N	2025-06-14 15:49:51.144814
24	6	login	{"source":"website","loginDate":"2025-06-14T15:50:54.226Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 15:50:54.237209
25	6	order_placed	{"orderId":7,"totalAmount":66.6225,"itemCount":1,"source":"website","orderDate":"2025-06-14T15:51:07.764Z"}	سفارش جدید به مبلغ $66.6225 ثبت شد	\N	7	\N	2025-06-14 15:51:07.901924
26	6	login	{"source":"website","loginDate":"2025-06-14T15:54:44.740Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 15:54:44.750961
27	6	login	{"source":"website","loginDate":"2025-06-14T16:01:37.422Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 16:01:37.43254
28	6	login	{"source":"website","loginDate":"2025-06-14T16:08:41.144Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 16:08:41.155603
29	6	login	{"source":"website","loginDate":"2025-06-14T16:30:18.939Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 16:30:18.949691
30	6	login	{"source":"website","loginDate":"2025-06-14T16:45:54.079Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 16:45:54.090244
31	6	login	{"source":"website","loginDate":"2025-06-14T17:21:25.160Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 17:21:25.17262
32	6	login	{"source":"website","loginDate":"2025-06-14T17:42:32.155Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 17:42:32.166612
33	6	login	{"source":"website","loginDate":"2025-06-14T17:50:47.290Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 17:50:47.300979
34	6	login	{"source":"website","loginDate":"2025-06-14T18:22:46.767Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 18:22:46.778472
35	6	order_placed	{"orderId":8,"totalAmount":97.96,"itemCount":2,"source":"website","orderDate":"2025-06-14T18:23:47.480Z"}	سفارش جدید به مبلغ $97.96 ثبت شد	\N	8	\N	2025-06-14 18:23:47.628298
36	6	login	{"source":"website","loginDate":"2025-06-14T18:47:55.638Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 18:47:55.648531
37	6	login	{"source":"website","loginDate":"2025-06-14T18:54:32.665Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 18:54:32.6766
38	6	order_placed	{"orderId":9,"totalAmount":66.6225,"itemCount":1,"source":"website","orderDate":"2025-06-14T18:54:54.914Z"}	سفارش جدید به مبلغ $66.6225 ثبت شد	\N	9	\N	2025-06-14 18:54:55.04801
39	6	order_placed	{"orderId":10,"totalAmount":2002.6025,"itemCount":3,"source":"website","orderDate":"2025-06-14T18:57:37.415Z"}	سفارش جدید به مبلغ $2002.6025 ثبت شد	\N	10	\N	2025-06-14 18:57:37.555958
40	6	login	{"source":"website","loginDate":"2025-06-14T19:00:55.471Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 19:00:55.48249
41	6	login	{"source":"website","loginDate":"2025-06-14T19:06:47.413Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-14 19:06:47.424137
42	5	customer_updated	{"updatedFields":["firstName","lastName","company","phone","country","city","address","postalCode","lastOrderDate","firstOrderDate","lastContactDate"]}	Customer information was updated	admin	\N	\N	2025-06-15 11:21:04.710949
43	5	order_placed	{"orderValue":104.5,"orderCount":1}	Order placed for $104.50	system	\N	\N	2025-06-15 11:21:04.745338
44	5	order_placed	{"orderId":11,"totalAmount":104.5,"itemCount":1,"source":"website","orderDate":"2025-06-15T11:21:04.905Z"}	سفارش جدید به مبلغ $104.5 ثبت شد	\N	11	\N	2025-06-15 11:21:04.915633
45	6	login	{"source":"website","loginDate":"2025-06-15T11:21:18.966Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-15 11:21:18.976642
46	6	login	{"source":"website","loginDate":"2025-06-15T11:28:06.552Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-15 11:28:06.564578
47	5	customer_updated	{"updatedFields":["firstName","lastName","company","phone","country","city","address","postalCode","lastOrderDate","firstOrderDate","lastContactDate"]}	Customer information was updated	admin	\N	\N	2025-06-15 11:29:08.279715
48	5	order_placed	{"orderValue":135.8375,"orderCount":1}	Order placed for $135.84	system	\N	\N	2025-06-15 11:29:08.300146
49	5	order_placed	{"orderId":12,"totalAmount":135.8375,"itemCount":2,"source":"website","orderDate":"2025-06-15T11:29:08.463Z"}	سفارش جدید به مبلغ $135.8375 ثبت شد	\N	12	\N	2025-06-15 11:29:08.472729
50	6	login	{"source":"website","loginDate":"2025-06-15T11:29:25.092Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-15 11:29:25.102271
51	6	login	{"source":"website","loginDate":"2025-06-15T11:38:40.567Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-15 11:38:40.577318
52	6	order_placed	{"orderId":13,"totalAmount":94,"itemCount":2,"source":"website","orderDate":"2025-06-15T11:38:57.284Z"}	سفارش جدید به مبلغ $94 ثبت شد	\N	13	\N	2025-06-15 11:38:57.422868
53	6	login	{"source":"website","loginDate":"2025-06-15T11:42:32.643Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-15 11:42:32.654152
54	6	order_placed	{"orderId":14,"totalAmount":81.3375,"itemCount":1,"source":"website","orderDate":"2025-06-15T11:42:51.541Z"}	سفارش جدید به مبلغ $81.3375 ثبت شد	\N	14	\N	2025-06-15 11:42:51.683981
55	7	customer_created	{}	Customer شکوفه غفاری was created	system	\N	\N	2025-06-15 11:46:40.011358
56	7	registration	{"source":"website","registrationDate":"2025-06-15T11:46:40.021Z"}	مشتری در فروشگاه آنلاین ثبت نام کرد	\N	\N	\N	2025-06-15 11:46:40.031077
57	7	login	{"source":"website","loginDate":"2025-06-15T11:48:42.003Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-15 11:48:42.014127
58	7	order_placed	{"orderId":15,"totalAmount":135.8375,"itemCount":2,"source":"website","orderDate":"2025-06-15T11:49:23.302Z"}	سفارش جدید به مبلغ $135.8375 ثبت شد	\N	15	\N	2025-06-15 11:49:23.440857
59	6	login	{"source":"website","loginDate":"2025-06-15T12:03:38.506Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-15 12:03:38.518309
60	6	login	{"source":"website","loginDate":"2025-06-15T12:05:06.971Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-15 12:05:06.981504
61	6	order_placed	{"orderId":16,"totalAmount":81.3375,"itemCount":1,"source":"website","orderDate":"2025-06-15T12:05:25.395Z"}	سفارش جدید به مبلغ $81.3375 ثبت شد	\N	16	\N	2025-06-15 12:05:25.54089
62	6	login	{"source":"website","loginDate":"2025-06-15T12:15:24.056Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-15 12:15:24.067869
63	6	login	{"source":"website","loginDate":"2025-06-15T13:05:43.789Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-15 13:05:43.800489
64	6	order_placed	{"orderId":17,"totalAmount":97.96,"itemCount":2,"source":"website","orderDate":"2025-06-15T13:06:02.083Z"}	سفارش جدید به مبلغ $97.96 ثبت شد	\N	17	\N	2025-06-15 13:06:02.221287
65	6	login	{"source":"website","loginDate":"2025-06-16T04:33:10.049Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-16 04:33:10.061462
66	6	order_placed	{"orderId":18,"totalAmount":104.5,"itemCount":1,"source":"website","orderDate":"2025-06-16T04:33:51.500Z"}	سفارش جدید به مبلغ $104.5 ثبت شد	\N	18	\N	2025-06-16 04:33:51.657741
67	6	login	{"source":"website","loginDate":"2025-06-16T06:37:08.311Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-16 06:37:08.324023
68	6	login	{"source":"website","loginDate":"2025-06-16T13:57:10.918Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-16 13:57:10.928658
69	6	order_placed	{"orderId":19,"totalAmount":482.185,"itemCount":1,"source":"website","orderDate":"2025-06-16T13:57:28.448Z"}	سفارش جدید به مبلغ $482.185 ثبت شد	\N	19	\N	2025-06-16 13:57:30.596756
70	6	login	{"source":"website","loginDate":"2025-06-16T15:38:32.364Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-16 15:38:32.375669
71	6	login	{"source":"website","loginDate":"2025-06-17T18:07:37.287Z","userAgent":"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-17 18:07:37.299892
72	6	order_placed	{"orderId":20,"totalAmount":99.8675,"itemCount":1,"source":"website","orderDate":"2025-06-17T18:08:03.074Z"}	سفارش جدید به مبلغ $99.8675 ثبت شد	\N	20	\N	2025-06-17 18:08:03.233045
\.


--
-- Data for Name: customer_inquiries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_inquiries (id, customer_id, inquiry_number, type, subject, message, priority, status, category, product_ids, attachments, contact_email, contact_phone, company, assigned_to, response_time, resolved_at, customer_rating, customer_feedback, internal_notes, created_at, updated_at) FROM stdin;
1	\N	INQ-1749821589682-2KAKPIJ7E	quote_request	Test Inquiry about Fuel Additive	I would like to request a quote for your fuel additive products.	normal	open	fuel-additives	[1]	\N	test@example.com	+1234567890	Test Company	\N	\N	\N	\N	\N	\N	2025-06-13 13:33:09.766713	2025-06-13 13:33:09.766713
2	\N	INQ-1749821612024-HG1UPFK8L	product_info	Inquiry about Premium Paint Thinner	I am interested in learning more about Premium Paint Thinner. Please provide me with detailed information including pricing, specifications, and availability.	normal	open	paint-thinner	[3]	\N	mr.ghafari@gmail.com	+989124955173	پتروشیمی شازند	\N	\N	\N	\N	\N	\N	2025-06-13 13:33:32.109477	2025-06-13 13:33:32.109477
3	\N	INQ-1749821651677-FVQ83OX68	product_info	Inquiry about Premium Paint Thinner	I am interested in learning more about Premium Paint Thinner. Please provide me with detailed information including pricing, specifications, and availability.	normal	open	paint-thinner	[3]	\N	mr.ghafari@gmail.com	+989124955173	پتروشیمی شازند	\N	\N	\N	\N	\N	\N	2025-06-13 13:34:11.780646	2025-06-13 13:34:11.780646
4	\N	INQ-1749821708507-IRYLBHCKD	product_info	Inquiry about Water Treatment Chemical A1	I am interested in learning more about Water Treatment Chemical A1. Please provide me with detailed information including pricing, specifications, and availability.	normal	open	water-treatment	[2]	\N	mr.ghafari@gmail.com	+989124955173	پتروشیمی شازند	\N	\N	\N	\N	\N	\N	2025-06-13 13:35:08.601533	2025-06-13 13:35:08.601533
5	\N	INQ-1749821867360-VKZENOLEH	product_info	Inquiry about Premium Paint Thinner	I am interested in learning more about Premium Paint Thinner. Please provide me with detailed information including pricing, specifications, and availability.	normal	open	paint-thinner	[3]	\N	mr.ghafari@gmail.com	+989124955173	پتروشیمی شازند	\N	\N	\N	\N	\N	\N	2025-06-13 13:37:47.450173	2025-06-13 13:37:47.450173
6	\N	INQ-1749822262101-89K8GCHXX	product_info	Inquiry about Fuel System Cleaner Pro	I am interested in learning more about Fuel System Cleaner Pro. Please provide me with detailed information including pricing, specifications, and availability.	normal	open	fuel-additives	[1]	\N	mr.ghafari@gmail.com	+989124955173	پتروشیمی شازند	\N	\N	\N	\N	\N	\N	2025-06-13 13:44:22.190821	2025-06-13 13:44:22.190821
7	\N	INQ-1749838370452-11POE1	product_info	Inquiry about NPK Fertilizer Complex	I am interested in learning more about NPK Fertilizer Complex. Please provide me with detailed information including pricing, specifications, and availability.	normal	open	agricultural-fertilizers	[4]	\N	admin@momtazchem.com	+989124955173		\N	\N	\N	\N	\N	\N	2025-06-13 18:12:50.545707	2025-06-13 18:12:50.545707
8	\N	INQ-1749892840288-SANNHB	product_info	Inquiry about Water Treatment Chemical A1	I am interested in learning more about Water Treatment Chemical A1. Please provide me with detailed information including pricing, specifications, and availability.	normal	open	water-treatment	[2]	\N	mr.ghafari@gmail.com	+989124955173	پتروشیمی شازند	\N	\N	\N	\N	\N	\N	2025-06-14 09:20:40.371319	2025-06-14 09:20:40.371319
\.


--
-- Data for Name: customer_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_orders (id, order_number, customer_id, total_amount, status, priority, currency, payment_status, payment_method, shipping_address, billing_address, notes, guest_email, guest_name, tracking_number, estimated_delivery, actual_delivery, internal_notes, created_at, updated_at, shipped_at, carrier, delivered_at) FROM stdin;
18	ORD-1750048431351-POADZKXCT	3	104.50	confirmed	normal	USD	pending	cash_on_delivery	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-16 04:33:51.444688	2025-06-16 04:35:20.373	\N	Overnight Shipping	\N
11	ORD-1749986464755-2FIAUT79Z	\N	104.50	pending	normal	USD	pending	\N	{"city": "TEHRAN", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 11:21:04.85064	2025-06-15 11:21:04.85064	\N	\N	\N
12	ORD-1749986948311-S9LG407T4	\N	135.84	pending	normal	USD	pending	\N	{"city": "TEHRAN", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 11:29:08.393724	2025-06-15 11:29:08.393724	\N	\N	\N
13	ORD-1749987537134-JSCY3Y1X3	3	94.00	pending	normal	USD	pending	\N	{"city": "TEHRAN", "address": "No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 11:38:57.214492	2025-06-15 11:38:57.214492	\N	\N	\N
14	ORD-1749987771414-VLH07PMWP	3	81.34	confirmed	normal	USD	pending	\N	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 11:42:51.500226	2025-06-15 11:48:01.413	\N	\N	\N
15	ORD-1749988163147-UG08DUQGO	4	135.84	pending	normal	USD	pending	\N	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 11:49:23.23428	2025-06-15 11:49:23.23428	\N	\N	\N
16	ORD-1749989125268-RB8UBCDA8	3	81.34	pending	normal	USD	pending	cash_on_delivery	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 12:05:25.351776	2025-06-15 12:05:25.351776	\N	Express Shipping (2-3 days)	\N
17	ORD-1749992761940-ZO49B851N	3	97.96	delivered	normal	USD	pending	cash_on_delivery	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 13:06:02.019266	2025-06-15 13:09:07.196	\N	Express Shipping (2-3 days)	\N
19	ORD-1750082248311-HNXACIC9Q	3	482.19	shipped	normal	USD	pending	cash_on_delivery	{"city": "تویسرکان", "address": "خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس, , تویسرکان, تهران, 6581813674, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-16 13:57:28.393648	2025-06-16 19:25:07.489	\N	Express Shipping (2-3 days)	\N
20	ORD-1750183682919-TADGY0YT9	3	99.87	shipped	normal	USD	pending	cash_on_delivery	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-17 18:08:03.0146	2025-06-17 18:11:50.963	\N	Express Shipping (2-3 days)	\N
\.


--
-- Data for Name: customer_segments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_segments (id, name, description, criteria, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, email, first_name, last_name, phone, company, tax_id, is_verified, is_active, total_orders, total_spent, last_order_date, notes, created_at, updated_at, password_hash, country, city, address, postal_code, email_verified, verification_token, reset_password_token, reset_password_expires) FROM stdin;
3	mr.ghafari@yahoo.com	محمدرضا	غفاری	09124955173	پتروشیمی شازند	\N	f	t	0	0.00	\N	\N	2025-06-14 15:32:26.286364	2025-06-14 15:32:26.286364	$2b$12$4MBIcVXXIDagWs.dD7OlHO80IYkq7aOjIZvvUYTpvQ/1AmicWfD1e	Iran	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	f	\N	\N	\N
2	sara.chemistry@example.com	سارا	شیمی	+98-21-55667788	آزمایشگاه شیمی سارا	\N	f	t	0	0.00	\N	\N	2025-06-14 09:34:50.475621	2025-06-14 09:34:50.678	\N	\N	\N	\N	\N	f	\N	\N	\N
1	mr.ghafari@gmail.com	محمدرضا	غفاری	09124955173	پتروشیمی شازند	\N	f	t	0	0.00	\N	\N	2025-06-13 01:59:12.524813	2025-06-14 14:23:39.148	\N	\N	\N	\N	\N	f	\N	\N	\N
4	reovo.ir@gmail.com	شکوفه	غفاری	\N	\N	\N	f	t	0	0.00	\N	\N	2025-06-15 11:46:39.955585	2025-06-15 11:46:39.955585	$2b$12$2R7afSKwXY28ZLHgMNpGVuCfQCZMGpuTYDkC0MI23KjNc5.L0f6Pe	Iran	تویسرکان	تویسرکان،خیابان حافظ شرقی جنب خدمات کامپیوتری گرین کد پستی 6581813674	\N	f	\N	\N	\N
\.


--
-- Data for Name: discount_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discount_settings (id, name, type, min_quantity, discount_percentage, is_active, description, created_at, updated_at, applicable_products, apply_to_all_products, applicable_categories) FROM stdin;
1	Bulk Discount 10+	quantity	10	5.00	t	خرید عمده - 5% تخفیف برای 10 عدد یا بیشتر	2025-06-13 02:12:16.680539	2025-06-13 02:12:16.680539	\N	t	\N
2	Bulk Discount 25+	quantity	25	10.00	t	خرید عمده - 10% تخفیف برای 25 عدد یا بیشتر	2025-06-13 02:12:16.680539	2025-06-13 02:12:16.680539	\N	t	\N
3	Bulk Discount 50+	quantity	50	12.00	t	خرید عمده - 15% تخفیف برای 50 عدد یا بیشتر	2025-06-13 02:12:16.680539	2025-06-13 02:12:16.680539	[]	t	\N
\.


--
-- Data for Name: email_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_categories (id, category_key, category_name, description, is_active, created_at, updated_at) FROM stdin;
1	admin	Admin & General Contact	Main administrative and general contact email	t	2025-06-14 07:18:33.689322	2025-06-14 07:18:33.689322
2	fuel-additives	Fuel Additives Department	Dedicated email for fuel additives inquiries and orders	t	2025-06-14 07:18:33.689322	2025-06-14 07:18:33.689322
3	water-treatment	Water Treatment Department	Dedicated email for water treatment solutions	t	2025-06-14 07:18:33.689322	2025-06-14 07:18:33.689322
4	agricultural-fertilizers	Agricultural Fertilizers Department	Dedicated email for fertilizer products and agricultural solutions	t	2025-06-14 07:18:33.689322	2025-06-14 07:18:33.689322
5	paint-thinner	Paint & Thinner Department	Dedicated email for paint and thinner products	t	2025-06-14 07:18:33.689322	2025-06-14 07:18:33.689322
6	orders	Order Processing	Handles order confirmations and processing	t	2025-06-14 07:18:33.689322	2025-06-14 07:18:33.689322
7	notifications	System Notifications	Receives system alerts and notifications	t	2025-06-14 07:18:33.689322	2025-06-14 07:18:33.689322
\.


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_logs (id, category_id, template_id, smtp_id, to_email, from_email, subject, status, error_message, sent_at, created_at) FROM stdin;
1	1	\N	\N	ali@test.com	info@momtazchem.com	Failed: New Contact Form Submission from علی احمدی	failed	No email configuration found for contact form	2025-06-14 08:34:43.548	2025-06-14 08:34:43.559453
2	1	\N	\N	info@momtazchem.com	info@momtazchem.com	New Contact Form Submission from Test User	sent	\N	2025-06-14 08:37:19.208	2025-06-14 08:37:19.220536
3	1	\N	\N	info@momtazchem.com	info@momtazchem.com	New Contact Form Submission from Test User	sent	\N	2025-06-14 09:03:19.462	2025-06-14 09:03:19.474298
4	1	\N	\N	info@momtazchem.com	info@momtazchem.com	New Contact Form Submission from محمدرضا غفاری	sent	\N	2025-06-14 09:04:34.947	2025-06-14 09:04:34.960176
5	1	\N	\N	info@momtazchem.com	info@momtazchem.com	New Contact Form Submission from تست کاربر	sent	\N	2025-06-14 09:08:35.792	2025-06-14 09:08:35.80476
6	1	\N	\N	info@momtazchem.com	info@momtazchem.com	New Contact Form Submission from محمدرضا غفاری	sent	\N	2025-06-14 09:08:50.051	2025-06-14 09:08:50.064409
7	1	\N	\N	info@momtazchem.com	info@momtazchem.com	New Contact Form Submission from تست CC	sent	\N	2025-06-14 09:09:18.338	2025-06-14 09:09:18.351774
8	1	\N	\N	info@momtazchem.com	info@momtazchem.com	New Contact Form Submission from علی احمدی	sent	\N	2025-06-14 09:09:42.8	2025-06-14 09:09:42.812614
9	1	\N	\N	info@momtazchem.com	info@momtazchem.com	New Contact Form Submission from علی احمدی	sent	\N	2025-06-14 09:10:04.698	2025-06-14 09:10:04.710262
10	1	\N	\N	ali.ahmadi@test.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - علی احمدی	sent	\N	2025-06-14 09:10:04.728	2025-06-14 09:10:04.739811
11	1	\N	\N	info@momtazchem.com	info@momtazchem.com	New Contact Form Submission from محمدرضا غفاری	sent	\N	2025-06-14 09:11:23.098	2025-06-14 09:11:23.111226
12	1	\N	\N	mr.ghafari@gmail.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - محمدرضا غفاری	sent	\N	2025-06-14 09:11:23.128	2025-06-14 09:11:23.141043
13	1	\N	\N	admin@momtazchem.com	info@momtazchem.com	New Contact Form Submission from تست نهایی	sent	\N	2025-06-14 09:15:09.047	2025-06-14 09:15:09.060947
14	1	\N	\N	test.final@example.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - تست نهایی	sent	\N	2025-06-14 09:15:09.079	2025-06-14 09:15:09.092738
15	1	\N	\N	admin@momtazchem.com	info@momtazchem.com	New Contact Form Submission from محمدرضا غفاری	sent	\N	2025-06-14 09:15:54.764	2025-06-14 09:15:54.776191
16	1	\N	\N	mr.ghafari@gmail.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - محمدرضا غفاری	sent	\N	2025-06-14 09:15:54.795	2025-06-14 09:15:54.807662
17	1	\N	\N	admin@momtazchem.com	info@momtazchem.com	New Contact Form Submission from محمدرضا غفاری	sent	\N	2025-06-14 09:18:02.303	2025-06-14 09:18:02.315605
18	1	\N	\N	mr.ghafari@gmail.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - محمدرضا غفاری	sent	\N	2025-06-14 09:18:02.34	2025-06-14 09:18:02.352372
19	1	\N	\N	admin@momtazchem.com	info@momtazchem.com	New Contact Form Submission from محمدرضا غفاری	sent	\N	2025-06-14 09:24:58.224	2025-06-14 09:24:58.236991
20	1	\N	\N	mr.ghafari@gmail.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - محمدرضا غفاری	sent	\N	2025-06-14 09:24:58.26	2025-06-14 09:24:58.273037
21	1	\N	\N	admin@momtazchem.com	info@momtazchem.com	New Contact Form Submission from محمدرضا غفاری	sent	\N	2025-06-14 09:41:38.672	2025-06-14 09:41:38.685427
22	1	\N	\N	mr.ghafari@gmail.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - محمدرضا غفاری	sent	\N	2025-06-14 09:41:38.702	2025-06-14 09:41:38.713765
23	1	\N	\N	admin@momtazchem.com	info@momtazchem.com	New Contact Form Submission from محمدرضا غفاری	sent	\N	2025-06-14 14:20:26.516	2025-06-14 14:20:26.528701
24	1	\N	\N	mr.ghafari@gmail.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - محمدرضا غفاری	sent	\N	2025-06-14 14:20:26.544	2025-06-14 14:20:26.555483
25	1	\N	\N		info@momtazchem.com	Failed: New Contact Form Submission from Mohammadreza Ghafari	failed	No recipients defined	2025-06-14 15:00:10.123	2025-06-14 15:00:10.134164
26	1	\N	\N	admin@momtazchem.com	info@momtazchem.com	New Contact Form Submission from محمدرضا غفاری	sent	\N	2025-06-16 13:55:03.936	2025-06-16 13:55:03.949984
27	1	\N	\N	mr.ghafari@gmail.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - محمدرضا غفاری	sent	\N	2025-06-16 13:55:03.973	2025-06-16 13:55:03.986061
28	1	\N	\N	admin@momtazchem.com	info@momtazchem.com	New Contact Form Submission from محمدرضا غفاری	sent	\N	2025-06-16 19:13:04.277	2025-06-16 19:13:04.293223
29	1	\N	\N	mr.ghafari@gmail.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - محمدرضا غفاری	sent	\N	2025-06-16 19:13:04.318	2025-06-16 19:13:04.330307
\.


--
-- Data for Name: email_recipients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_recipients (id, category_id, email, name, is_primary, is_active, receive_types, created_at, updated_at) FROM stdin;
2	2	fuel@momtazchem.com	Fuel Additives Team	t	t	{inquiries,orders,support}	2025-06-14 07:18:42.313137	2025-06-14 07:18:42.313137
3	3	water@momtazchem.com	Water Treatment Team	t	t	{inquiries,orders,consulting}	2025-06-14 07:18:42.313137	2025-06-14 07:18:42.313137
4	4	fertilizer@momtazchem.com	Agricultural Team	t	t	{inquiries,orders,consulting}	2025-06-14 07:18:42.313137	2025-06-14 07:18:42.313137
5	5	thinner@momtazchem.com	Paint & Thinner Team	t	t	{inquiries,orders,support}	2025-06-14 07:18:42.313137	2025-06-14 07:18:42.313137
6	6	info@momtazchem.com	Order Processing	t	t	{confirmations,updates,shipping}	2025-06-14 07:18:42.313137	2025-06-14 07:18:42.313137
7	7	info@momtazchem.com	System Admin	t	t	{alerts,notifications,errors}	2025-06-14 07:18:42.313137	2025-06-14 07:18:42.313137
10	1	admin@momtazchem.com	Momtaz Chemical Admin Inbox	f	t	{contact_form,general_inquiry,admin_notification}	2025-06-14 09:14:51.408707	2025-06-14 09:14:51.408707
9	1	info@momtazchem.com	Momtaz Chemical Admin	t	f	{contact_form,general_inquiry,admin_notification}	2025-06-14 08:59:54.599589	2025-06-14 08:59:54.599589
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_templates (id, name, category, subject, html_content, text_content, variables, is_active, is_default, language, created_by, usage_count, last_used, created_at, updated_at) FROM stdin;
1	Technical Support Response	technical_support	Re: Technical Support Request - {{ticket_number}}	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n<div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 8px 8px 0 0;">\n<h1 style="color: white; margin: 0; font-size: 24px;">Technical Support Response</h1>\n</div>\n<div style="background: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #bbf7d0;">\n<div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">\n<h2 style="color: #059669; margin-top: 0;">Dear {{customer_name}},</h2>\n<p>Thank you for contacting our technical support team. We have received your request and assigned ticket number <strong>{{ticket_number}}</strong> to track your case.</p>\n<p><strong>Support Details:</strong></p>\n<ul>\n<li>Ticket Number: {{ticket_number}}</li>\n<li>Priority: {{priority}}</li>\n<li>Support Agent: {{support_agent}}</li>\n<li>Estimated Resolution: {{estimated_resolution}}</li>\n</ul>\n<p>Our technical team is working on your request and will provide you with:</p>\n<ul>\n<li>Detailed analysis of the issue</li>\n<li>Step-by-step solution instructions</li>\n<li>Additional documentation if needed</li>\n<li>Follow-up support if required</li>\n</ul>\n<p>We will keep you updated on the progress and provide a resolution within the estimated timeframe.</p>\n</div>\n<div style="background: white; padding: 20px; border-radius: 6px;">\n<h3 style="color: #059669; margin-top: 0;">Contact Technical Support</h3>\n<p><strong>Momtazchem Technical Team</strong><br/>\nEmail: support@momtazchem.com<br/>\nPhone: +98 21 1234 5678<br/>\nTicket System: Available 24/7</p>\n</div>\n</div>\n</div>	Dear {{customer_name}},\n\nThank you for contacting our technical support team. We have received your request and assigned ticket number {{ticket_number}} to track your case.\n\nSupport Details:\n- Ticket Number: {{ticket_number}}\n- Priority: {{priority}}\n- Support Agent: {{support_agent}}\n- Estimated Resolution: {{estimated_resolution}}\n\nOur technical team is working on your request and will provide detailed analysis, solution instructions, and follow-up support.\n\nBest regards,\nMomtazchem Technical Team\nsupport@momtazchem.com	\N	t	t	en	1	0	\N	2025-06-13 13:40:18.364451	2025-06-13 13:40:18.364451
2	Product Information Response	product_info	Product Information: {{product_name}}	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n<div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 20px; border-radius: 8px 8px 0 0;">\n<h1 style="color: white; margin: 0; font-size: 24px;">Product Information</h1>\n</div>\n<div style="background: #faf5ff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9d5ff;">\n<div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">\n<h2 style="color: #7c3aed; margin-top: 0;">Dear {{customer_name}},</h2>\n<p>Thank you for your interest in <strong>{{product_name}}</strong>. Here is the detailed information you requested:</p>\n<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">\n<h3 style="color: #7c3aed; margin-top: 0;">Product Overview</h3>\n<p><strong>Product Name:</strong> {{product_name}}<br/>\n<strong>Category:</strong> {{product_category}}<br/>\n<strong>Description:</strong> {{product_description}}</p>\n</div>\n<p><strong>Key Features:</strong></p>\n<div style="margin: 10px 0;">{{product_features}}</div>\n<p>This product is designed to meet the highest industry standards and has been tested for quality and performance.</p>\n<p>If you would like to receive a detailed quote or need additional technical specifications, please let us know your requirements.</p>\n</div>\n<div style="background: white; padding: 20px; border-radius: 6px;">\n<h3 style="color: #7c3aed; margin-top: 0;">Need More Information?</h3>\n<p>Contact our product specialists for detailed specifications, pricing, and availability.</p>\n<p><strong>Momtazchem Product Team</strong><br/>\nEmail: products@momtazchem.com<br/>\nPhone: +98 21 1234 5678</p>\n</div>\n</div>\n</div>	Dear {{customer_name}},\n\nThank you for your interest in {{product_name}}. Here is the detailed information you requested:\n\nProduct Overview:\n- Product Name: {{product_name}}\n- Category: {{product_category}}\n- Description: {{product_description}}\n\nKey Features:\n{{product_features}}\n\nThis product meets the highest industry standards and has been tested for quality and performance.\n\nFor detailed quotes or additional specifications, please contact our product team.\n\nBest regards,\nMomtazchem Product Team\nproducts@momtazchem.com	\N	t	t	en	1	0	\N	2025-06-13 13:40:18.364451	2025-06-13 13:40:18.364451
3	General Inquiry Response	general	Re: Your Inquiry - {{inquiry_number}}	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n<div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 20px; border-radius: 8px 8px 0 0;">\n<h1 style="color: white; margin: 0; font-size: 24px;">Thank you for contacting us!</h1>\n</div>\n<div style="background: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #fecaca;">\n<div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">\n<h2 style="color: #dc2626; margin-top: 0;">Dear {{customer_name}},</h2>\n<p>Thank you for reaching out to Momtazchem. We have received your inquiry ({{inquiry_number}}) and appreciate your interest in our chemical solutions.</p>\n<p>Our team is reviewing your message and will respond with the information you need. We strive to provide comprehensive answers to all inquiries within 24 hours.</p>\n<p>At Momtazchem, we specialize in:</p>\n<ul>\n<li>Fuel additives for enhanced performance</li>\n<li>Water treatment chemicals and solutions</li>\n<li>Paint and thinner products</li>\n<li>Agricultural fertilizers and nutrients</li>\n</ul>\n<p>If your inquiry is urgent or requires immediate attention, please contact us directly using the information below.</p>\n</div>\n<div style="background: white; padding: 20px; border-radius: 6px;">\n<h3 style="color: #dc2626; margin-top: 0;">Contact Information</h3>\n<p><strong>Momtazchem Customer Service</strong><br/>\nEmail: info@momtazchem.com<br/>\nPhone: +98 21 1234 5678<br/>\nBusiness Hours: Saturday - Thursday, 8:00 AM - 6:00 PM</p>\n</div>\n</div>\n</div>	Dear {{customer_name}},\n\nThank you for reaching out to Momtazchem. We have received your inquiry ({{inquiry_number}}) and appreciate your interest in our chemical solutions.\n\nOur team is reviewing your message and will respond within 24 hours.\n\nAt Momtazchem, we specialize in:\n- Fuel additives for enhanced performance\n- Water treatment chemicals and solutions\n- Paint and thinner products\n- Agricultural fertilizers and nutrients\n\nFor urgent matters, contact us directly:\nMomtazchem Customer Service\ninfo@momtazchem.com\n+98 21 1234 5678\n\nBest regards,\nMomtazchem Team	\N	t	t	en	1	0	\N	2025-06-13 13:40:18.364451	2025-06-13 13:40:18.364451
\.


--
-- Data for Name: equipment_maintenance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment_maintenance (id, equipment_name, equipment_code, production_line_id, maintenance_type, scheduled_date, completed_date, status, technician_name, description, cost, downtime_hours, created_at, updated_at) FROM stdin;
4	راکتور اسید سولفوریک شماره 1	REACTOR-SA-01	1	preventive	2025-06-10 06:00:00	2025-06-10 08:00:00	completed	مهندس محمد حسینی	تعمیر و نگهداری دوره ای راکتور اصلی - تعویض سیل ها و بازرسی	2500000.00	2.00	2025-06-14 19:15:00.944196	2025-06-14 19:15:00.944196
5	سیستم تهویه سالن کودسازی	VENT-FERT-02	2	corrective	2025-06-12 10:00:00	2025-06-12 16:00:00	completed	تکنسین احمد رضایی	تعمیر فن اصلی و تعویض فیلترهای هوا	1800000.00	6.00	2025-06-14 19:15:00.944196	2025-06-14 19:15:00.944196
6	پمپ انتقال مواد شیمیایی	PUMP-CHEM-03	3	preventive	2025-06-14 08:00:00	2025-06-14 10:30:00	completed	مهندس فاطمه کریمی	بازرسی و تعویض پیکینگ پمپ - روغن کاری	950000.00	2.50	2025-06-14 19:15:00.944196	2025-06-14 19:15:00.944196
7	میکسر رنگ صنعتی	MIXER-PAINT-04	5	corrective	2025-06-13 14:00:00	\N	in_progress	مهندس علی صادقی	تعمیر موتور میکسر و تعویض بلبرینگ های فرسوده	3200000.00	8.00	2025-06-14 19:15:00.944196	2025-06-14 19:15:00.944196
8	دستگاه تقطیر متانول	DISTILL-METH-05	6	preventive	2025-06-15 09:00:00	\N	scheduled	مهندس سارا ملکی	تمیزکاری کامل ستون تقطیر و کالیبراسیون سنسورها	1500000.00	4.00	2025-06-14 19:15:00.944196	2025-06-14 19:15:00.944196
9	خط بسته بندی اوره	PACK-UREA-06	2	preventive	2025-06-16 07:00:00	\N	scheduled	تکنسین محسن زارعی	تعمیر و تنظیم دستگاه های بسته بندی و توزین	1200000.00	3.00	2025-06-14 19:15:00.944196	2025-06-14 19:15:00.944196
10	سیستم کنترل دما راکتور	TEMP-CTRL-07	1	corrective	2025-06-11 12:00:00	2025-06-11 15:00:00	completed	مهندس حسین نوری	تعمیر و کالیبراسیون سنسورهای دمایی	850000.00	3.00	2025-06-14 19:15:00.944196	2025-06-14 19:15:00.944196
11	کمپرسور هوای فشرده	COMPRS-AIR-08	7	preventive	2025-06-17 08:00:00	\N	scheduled	مهندس زهرا حیدری	تعویض روغن و فیلترهای کمپرسور اصلی	750000.00	2.00	2025-06-14 19:15:00.944196	2025-06-14 19:15:00.944196
12	سیستم تصفیه پساب	WASTE-TREAT-09	8	corrective	2025-06-18 10:00:00	\N	scheduled	مهندس مریم اسماعیلی	تعمیر پمپ های انتقال و تمیزکاری مخازن	2100000.00	6.00	2025-06-14 19:15:00.944196	2025-06-14 19:15:00.944196
13	دستگاه آنالیز کیفیت محصول	QC-ANALYZER-10	3	preventive	2025-06-14 13:00:00	2025-06-14 14:30:00	completed	مهندس محمد قاسمی	کالیبراسیون و تست دقت دستگاه های آنالیز	1100000.00	1.50	2025-06-14 19:15:00.944196	2025-06-14 19:15:00.944196
\.


--
-- Data for Name: financial_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.financial_transactions (id, type, order_id, amount, description, reference_number, status, processing_date, metadata, created_at) FROM stdin;
3	refund	1	95.99	Customer refund - defective product	REF-1749781500001	completed	2025-06-12 14:25:42.682818	{"reason": "defective product", "originalOrderId": 1}	2025-06-13 02:25:42.682818
\.


--
-- Data for Name: inventory_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_movements (id, raw_material_id, movement_type, quantity, unit, reference_id, reference_type, movement_date, notes, performed_by, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_transactions (id, product_id, type, quantity, reference_id, reference_type, notes, created_at) FROM stdin;
\.


--
-- Data for Name: lead_activities; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, product_snapshot, created_at, unit, specifications, notes) FROM stdin;
15	11	14	Fuel System Cleaner Pro	SP-1-FUEL-SYSTE	1.000	50.00	50.00	\N	2025-06-14 14:23:39.03323	units	\N	\N
24	11	14	Fuel System Cleaner Pro	SP-1-FUEL-SYSTE	1.000	50.00	50.00	\N	2025-06-15 11:21:04.889275	units	\N	\N
25	12	3	Fuel System Cleaner Premium FSC-Pro	FSC-PRO-500ML	1.000	28.75	28.75	\N	2025-06-15 11:29:08.426804	units	\N	\N
26	12	14	Fuel System Cleaner Pro	SP-1-FUEL-SYSTE	1.000	50.00	50.00	\N	2025-06-15 11:29:08.453272	units	\N	\N
27	13	3	Fuel System Cleaner Premium FSC-Pro		1.000	28.75	28.75	\N	2025-06-15 11:38:57.248586	units	\N	\N
28	13	4	Diesel Anti-Gel Additive DAG-Winter		1.000	15.25	15.25	\N	2025-06-15 11:38:57.274389	units	\N	\N
29	14	3	Fuel System Cleaner Premium FSC-Pro	FSC-PRO-500ML	1.000	28.75	28.75	\N	2025-06-15 11:42:51.529122	units	\N	\N
30	15	3	Fuel System Cleaner Premium FSC-Pro	FSC-PRO-500ML	1.000	28.75	28.75	\N	2025-06-15 11:49:23.265285	units	\N	\N
31	15	14	Fuel System Cleaner Pro	SP-1-FUEL-SYSTE	1.000	50.00	50.00	\N	2025-06-15 11:49:23.29078	units	\N	\N
32	16	3	Fuel System Cleaner Premium FSC-Pro	FSC-PRO-500ML	1.000	28.75	28.75	\N	2025-06-15 12:05:25.382514	units	\N	\N
33	17	3	Fuel System Cleaner Premium FSC-Pro	FSC-PRO-500ML	1.000	28.75	28.75	\N	2025-06-15 13:06:02.049233	units	\N	\N
34	17	4	Diesel Anti-Gel Additive DAG-Winter	DAG-WINTER-250ML	1.000	15.25	15.25	\N	2025-06-15 13:06:02.073202	units	\N	\N
35	18	14	Fuel System Cleaner Pro	SP-1-FUEL-SYSTE	1.000	50.00	50.00	\N	2025-06-16 04:33:51.483805	units	\N	\N
36	19	4	Diesel Anti-Gel Additive DAG-Winter	DAG-WINTER-250ML	26.000	15.25	396.50	\N	2025-06-16 13:57:28.431785	units	\N	\N
37	20	4	Diesel Anti-Gel Additive DAG-Winter	DAG-WINTER-250ML	3.000	15.25	45.75	\N	2025-06-17 18:08:03.05607	units	\N	\N
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, order_number, customer_id, status, payment_status, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, currency, notes, billing_address, shipping_address, shipping_method, tracking_number, order_date, shipped_date, delivered_date, created_at, updated_at) FROM stdin;
5	ORD-1749787903550-BKNM9	1	delivered	pending	78.75	7.09	50.00	0.00	135.84	USD		{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	standard	\N	2025-06-13 04:11:43.719	\N	\N	2025-06-13 04:11:43.732826	2025-06-13 04:12:11.937
3	ORD-1749782065311-1RABJ	1	delivered	pending	1755.00	157.95	0.00	0.00	1912.95	USD		{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	{"firstName":"شکوفه","lastName":"غفاری","company":"","address1":"خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس","address2":"","city":"تویسرکان","state":"تهران","postalCode":"6581813674","country":"Iran","phone":"09124955173"}	standard	\N	2025-06-13 02:34:25.413	\N	\N	2025-06-13 02:34:25.425615	2025-06-13 02:59:28.89
1	ORD-1749779952414-NIOK3	1	delivered	pending	45.99	4.14	50.00	0.00	100.13	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	standard	\N	2025-06-13 01:59:12.544	\N	\N	2025-06-13 01:59:12.55602	2025-06-13 02:11:30.209
2	ORD-1749780109958-43Y4H	1	delivered	pending	32.50	2.93	50.00	0.00	85.43	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	express	\N	2025-06-13 02:01:49.981	\N	\N	2025-06-13 02:01:49.994158	2025-06-13 02:13:19.766
4	ORD-1749783637801-YJUS7	1	delivered	pending	365.25	32.87	50.00	0.00	448.12	USD		{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	express	\N	2025-06-13 03:00:37.907	\N	\N	2025-06-13 03:00:37.920409	2025-06-13 03:01:30.334
6	ORD-1749819744483-QAJI3	1	delivered	pending	50.00	4.50	50.00	0.00	104.50	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	express	\N	2025-06-13 13:02:24.59	\N	\N	2025-06-13 13:02:24.603178	2025-06-14 06:35:34.09
10	ORD-1749893690345-SUFZM	2	shipped	pending	2250.00	225.00	50.00	0.00	2525.00	USD	تست سیستم CRM خودکار	{"country":"Iran","city":"Tehran","address":"خیابان ولیعصر، پلاک 123","postalCode":"1234567890"}	{"country":"Iran","city":"Tehran","address":"خیابان ولیعصر، پلاک 123","postalCode":"1234567890"}	standard	\N	2025-06-14 09:34:50.498	\N	\N	2025-06-14 09:34:50.510526	2025-06-14 18:24:58.33
8	ORD-1749893441541-W7PF9	1	shipped	pending	44.00	3.96	50.00	0.00	97.96	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	express	\N	2025-06-14 09:30:41.647	\N	\N	2025-06-14 09:30:41.660566	2025-06-14 18:25:05.066
7	ORD-1749882311403-YJV8U	1	shipped	pending	274.50	24.71	50.00	0.00	349.21	USD		{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	{"firstName":"محمدرضا","lastName":"غفاری","company":"پتروشیمی شازند","address1":"شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10","address2":"","city":"تهران","state":"تهران","postalCode":"1478815493","country":"Iran","phone":"09124955173"}	express	\N	2025-06-14 06:25:11.516	\N	\N	2025-06-14 06:25:11.528455	2025-06-14 18:25:09.208
9	ORD-1749893474344-TQ5QI	1	shipped	pending	78.75	7.09	50.00	0.00	135.84	USD		{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	express	\N	2025-06-14 09:31:14.44	\N	\N	2025-06-14 09:31:14.455454	2025-06-14 18:25:02.398
11	ORD-1749911018848-H9C23	1	confirmed	pending	50.00	4.50	50.00	0.00	104.50	USD		{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	{"firstName":"Mohammadreza","lastName":"Ghafari","company":"پتروشیمی شازند","address1":"No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN","address2":"","city":"TEHRAN","state":"تهران","postalCode":"1968913751","country":"Iran","phone":"02182122282"}	express	\N	2025-06-14 14:23:38.985	\N	\N	2025-06-14 14:23:39.000887	2025-06-14 18:29:12.057
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_resets (id, email, token, expires_at, used, created_at) FROM stdin;
1	mr.ghafari@gmail.com	7cg50rc8hf8mbubblth	2025-06-13 05:33:38.357	t	2025-06-13 04:33:38.36964
\.


--
-- Data for Name: procedure_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedure_categories (id, name, description, color_code, display_order, is_active, created_at, updated_at) FROM stdin;
1	روش‌های تولید	دستورالعمل‌های مربوط به فرآیندهای تولید	#10b981	1	t	2025-06-14 14:20:47.765543	2025-06-14 14:20:47.765543
2	ایمنی و بهداشت	پروتکل‌های ایمنی و بهداشت کار	#ef4444	2	t	2025-06-14 14:20:47.765543	2025-06-14 14:20:47.765543
3	کنترل کیفیت	روش‌های آزمایش و کنترل کیفیت	#3b82f6	3	t	2025-06-14 14:20:47.765543	2025-06-14 14:20:47.765543
4	نگهداری و تعمیرات	دستورالعمل‌های نگهداری تجهیزات	#f59e0b	4	t	2025-06-14 14:20:47.765543	2025-06-14 14:20:47.765543
5	مدیریت موجودی	روش‌های مدیریت انبار و موجودی	#8b5cf6	5	t	2025-06-14 14:20:47.765543	2025-06-14 14:20:47.765543
6	مدیریت زیست‌محیطی	پروتکل‌های حفاظت از محیط زیست	#059669	6	t	2025-06-14 14:20:47.765543	2025-06-14 14:20:47.765543
7	اداری		#3b82f6	0	t	2025-06-14 15:31:10.71409	2025-06-14 15:31:10.71409
\.


--
-- Data for Name: procedure_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedure_documents (id, procedure_id, outline_id, title, description, file_name, file_path, file_size, file_type, upload_date, uploaded_by, version, is_active, download_count, last_downloaded_at, tags, created_at, updated_at, document_type) FROM stdin;
5	1	\N	Screenshot (84).png	فایل ضمیمه: Screenshot (84).png	document-1749912495572-984097967.png	/home/runner/workspace/uploads/documents/document-1749912495572-984097967.png	1229960	image/png	2025-06-14 14:48:55.919426	1	\N	f	2	2025-06-14 16:15:46.157235	{}	2025-06-14 14:48:55.919426	2025-06-14 16:32:03.538851	procedure
7	2	\N	Screenshot 2025-06-14 170822.png	فایل ضمیمه: Screenshot 2025-06-14 170822.png	document-1749912642216-691713809.png	/home/runner/workspace/uploads/documents/document-1749912642216-691713809.png	277961	image/png	2025-06-14 14:50:48.873968	1	\N	f	1	2025-06-14 17:09:48.923765	{}	2025-06-14 14:50:48.873968	2025-06-14 17:09:53.825053	procedure
8	1	\N	Screenshot 2025-06-14 170822.png	فایل ضمیمه: Screenshot 2025-06-14 170822.png	document-1749913348221-181833038.png	/home/runner/workspace/uploads/documents/document-1749913348221-181833038.png	277961	image/png	2025-06-14 15:02:33.560703	1	\N	t	0	\N	{}	2025-06-14 15:02:33.560703	2025-06-14 15:02:33.560703	procedure
9	1	\N	Screenshot 2025-06-14 170822.png	فایل ضمیمه: Screenshot 2025-06-14 170822.png	document-1749913355283-507192448.png	/home/runner/workspace/uploads/documents/document-1749913355283-507192448.png	277961	image/png	2025-06-14 15:02:40.464471	1	\N	t	0	\N	{}	2025-06-14 15:02:40.464471	2025-06-14 15:02:40.464471	procedure
10	1	\N	Screenshot 2025-06-14 170822.png	فایل ضمیمه: Screenshot 2025-06-14 170822.png	document-1749913362219-688560143.png	/home/runner/workspace/uploads/documents/document-1749913362219-688560143.png	277961	image/png	2025-06-14 15:02:51.108119	1	\N	t	0	\N	{}	2025-06-14 15:02:51.108119	2025-06-14 15:02:51.108119	procedure
1	1	3	جدول نسبت مواد NPK	جدول دقیق نسبت‌های مواد اولیه برای تولید کود NPK	NPK_Ratios_Table.txt	uploads/documents/NPK_Ratios_Table.txt	1024	text/plain	2025-06-14 14:24:01.245661	1	1.0	t	1	2025-06-14 15:03:00.825816	{جدول,نسبت,NPK}	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661	procedure
11	4	\N	Screenshot 2025-06-14 171857.png	فایل ضمیمه: Screenshot 2025-06-14 171857.png	document-1749913401205-396084944.png	/home/runner/workspace/uploads/documents/document-1749913401205-396084944.png	264659	image/png	2025-06-14 15:03:27.483799	1	\N	t	0	\N	{}	2025-06-14 15:03:27.483799	2025-06-14 15:03:27.483799	procedure
12	4	\N	Screenshot 2025-06-14 171857.png	فایل ضمیمه: Screenshot 2025-06-14 171857.png	document-1749913410104-874858742.png	/home/runner/workspace/uploads/documents/document-1749913410104-874858742.png	264659	image/png	2025-06-14 15:03:38.288342	1	\N	t	0	\N	{}	2025-06-14 15:03:38.288342	2025-06-14 15:03:38.288342	procedure
4	2	13	نقشه تخلیه اضطراری	نقشه مسیرهای تخلیه آزمایشگاه	Emergency_Evacuation_Map.png	/uploads/documents/Emergency_Evacuation_Map.png	512000	image/png	2025-06-14 14:24:01.245661	1	1.0	t	2	2025-06-14 15:03:38.994843	{نقشه,تخلیه,اضطراری}	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661	procedure
2	1	7	فرم کنترل کیفیت	فرم استاندارد برای ثبت نتایج کنترل کیفیت	Quality_Control_Form.txt	uploads/documents/Quality_Control_Form.txt	2048	text/plain	2025-06-14 14:24:01.245661	1	1.0	t	2	2025-06-14 15:03:41.385403	{فرم,کیفیت,تست}	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661	procedure
13	4	\N	Screenshot 2025-06-14 171857.png	فایل ضمیمه: Screenshot 2025-06-14 171857.png	document-1749913418433-365158547.png	/home/runner/workspace/uploads/documents/document-1749913418433-365158547.png	264659	image/png	2025-06-14 15:03:45.153113	1	\N	t	0	\N	{}	2025-06-14 15:03:45.153113	2025-06-14 15:03:45.153113	procedure
14	2	\N	خیام باشی دو (2).pdf	فایل ضمیمه: خیام باشی دو (2).pdf	Ø®ÛØ§Ù Ø¨Ø§Ø´Û Ø¯Ù (2).pdf	/home/runner/workspace/uploads/documents/document-1749913814173-397843662.pdf	184125	application/pdf	2025-06-14 15:10:19.786309	1	1.0	t	0	\N	{}	2025-06-14 15:10:19.786309	2025-06-14 15:10:19.786309	procedure
15	3	\N	procedure-1-2025-06-14.pdf	فایل ضمیمه: procedure-1-2025-06-14.pdf	procedure-1-2025-06-14.pdf	/home/runner/workspace/uploads/documents/document-1749915045480-705007329.pdf	43288	application/pdf	2025-06-14 15:30:46.124168	1	1.0	t	0	\N	{}	2025-06-14 15:30:46.124168	2025-06-14 15:30:46.124168	procedure
3	2	11	فهرست تجهیزات ایمنی	لیست کامل تجهیزات ایمنی مورد نیاز	Safety_Equipment_List.txt	uploads/documents/Safety_Equipment_List.txt	1536	text/plain	2025-06-14 14:24:01.245661	1	1.0	f	2	2025-06-14 16:33:51.163664	{ایمنی,تجهیزات,فهرست}	2025-06-14 14:24:01.245661	2025-06-14 16:33:58.376143	procedure
6	2	\N	Screenshot 2025-06-14 170822.png	فایل ضمیمه: Screenshot 2025-06-14 170822.png	document-1749912635349-448532705.png	/home/runner/workspace/uploads/documents/document-1749912635349-448532705.png	277961	image/png	2025-06-14 14:50:40.404879	1	\N	f	10	2025-06-14 16:33:13.6723	{}	2025-06-14 14:50:40.404879	2025-06-14 16:39:30.280123	procedure
16	5	\N	momtazchem_emails_en.docx	فایل ضمیمه: momtazchem_emails_en.docx	momtazchem_emails_en.docx	/home/runner/workspace/uploads/documents/document-1749917726137-471060478.docx	8566	application/vnd.openxmlformats-officedocument.wordprocessingml.document	2025-06-14 16:15:26.153451	1	1.0	f	0	\N	{}	2025-06-14 16:15:26.153451	2025-06-14 17:09:26.674464	procedure
17	6	\N	momtazchem_emails_en.docx	فایل ضمیمه: momtazchem_emails_en.docx	momtazchem_emails_en.docx	/home/runner/workspace/uploads/documents/document-1749918250381-182922793.docx	8566	application/vnd.openxmlformats-officedocument.wordprocessingml.document	2025-06-14 16:24:10.394752	1	1.0	t	2	2025-06-16 19:22:32.107859	{}	2025-06-14 16:24:10.394752	2025-06-14 16:24:10.394752	procedure
\.


--
-- Data for Name: procedure_feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedure_feedback (id, procedure_id, user_id, rating, comment, suggestions, is_helpful, created_at) FROM stdin;
\.


--
-- Data for Name: procedure_outlines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedure_outlines (id, procedure_id, parent_id, level, order_number, title, content, is_collapsible, is_expanded, created_at, updated_at) FROM stdin;
1	1	\N	1	1	مقدمه و اهداف	هدف از این دستورالعمل ارائه راهنمای جامع برای تولید کود NPK با کیفیت است	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
2	1	\N	1	2	مواد و تجهیزات	فهرست کامل مواد اولیه و تجهیزات مورد نیاز	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
3	1	\N	2	1	مواد اولیه	نیتروژن خالص، فسفر پنتاکساید، پتاسیم کلراید	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
4	1	\N	2	2	تجهیزات	میکسر صنعتی، ترازو دقیق، سیستم کنترل دما	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
5	1	\N	1	3	مراحل تولید	شرح کامل فرآیند تولید به تفکیک مراحل	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
6	1	\N	2	1	آماده‌سازی	آماده‌سازی و کنترل کیفیت مواد اولیه	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
7	1	\N	2	2	مخلوط‌سازی	ترکیب مواد در میکسر با نسبت‌های مشخص	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
8	1	\N	2	3	کنترل کیفیت	آزمایش‌های کیفی و کمی محصول نهایی	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
9	2	\N	1	1	قوانین کلی ایمنی	اصول پایه ایمنی در آزمایشگاه	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
10	2	\N	1	2	تجهیزات حفاظتی	فهرست و نحوه استفاده از تجهیزات ایمنی	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
11	2	\N	2	1	تجهیزات فردی	عینک، دستکش، روپوش و کفش ایمنی	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
12	2	\N	2	2	تجهیزات جمعی	دوش اضطراری، شستشوی چشم، تهویه	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
13	2	\N	1	3	اقدامات اضطراری	نحوه عملکرد در شرایط بحرانی	t	f	2025-06-14 14:24:01.245661	2025-06-14 14:24:01.245661
\.


--
-- Data for Name: procedure_revisions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedure_revisions (id, procedure_id, version, changes_summary, content, revised_by, revision_date, reason) FROM stdin;
\.


--
-- Data for Name: procedure_steps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedure_steps (id, procedure_id, step_number, title, description, instructions, estimated_time, required_tools, safety_notes, quality_checkpoints, attachments, is_critical, created_at) FROM stdin;
1	1	1	آماده‌سازی مواد اولیه	بررسی و آماده‌سازی مواد خام	مواد را از انبار دریافت کرده و کیفیت آن‌ها را بررسی کنید	15	{ترازو,"ظروف اندازه‌گیری"}	از دستکش و ماسک استفاده کنید	\N	[]	t	2025-06-14 14:20:47.765543
2	1	2	وزن‌کردن دقیق	اندازه‌گیری دقیق مواد بر اساس فرمول	با ترازو دقیق، مقادیر مشخص شده را وزن کنید	20	{"ترازو دقیق"}	دقت در اندازه‌گیری ضروری است	\N	[]	t	2025-06-14 14:20:47.765543
3	1	3	مخلوط‌کردن	ترکیب مواد در میکسر صنعتی	مواد را به ترتیب مشخص به میکسر اضافه کنید	30	{"میکسر صنعتی"}	از ایمنی میکسر اطمینان حاصل کنید	\N	[]	f	2025-06-14 14:20:47.765543
\.


--
-- Data for Name: procedure_training; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedure_training (id, procedure_id, user_id, training_date, trainer_id, completion_status, test_score, certification_date, expiry_date, notes, created_at) FROM stdin;
\.


--
-- Data for Name: procedures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedures (id, title, category_id, description, content, version, status, priority, language, author_id, approver_id, approved_at, effective_date, review_date, tags, attachments, access_level, view_count, last_viewed_at, created_at, updated_at) FROM stdin;
1	دستورالعمل تولید کود NPK	1	روش تولید کود مرکب NPK با کیفیت بالا	# دستورالعمل تولید کود NPK\n\n## مواد اولیه مورد نیاز:\n- نیتروژن خالص: 20 کیلوگرم\n- فسفر پنتاکساید: 15 کیلوگرم  \n- پتاسیم کلراید: 10 کیلوگرم\n\n## مراحل تولید:\n1. آماده‌سازی مواد اولیه\n2. وزن‌کردن دقیق مواد\n3. مخلوط‌کردن در میکسر\n4. کنترل دما و رطوبت\n5. گرانول‌سازی\n6. خشک‌کردن\n7. بسته‌بندی\n\n## نکات ایمنی:\n- استفاده از ماسک و عینک ایمنی\n- تهویه مناسب محل کار\n- در صورت تماس با پوست، فوراً با آب شستشو دهید	2.1	approved	high	fa	1	\N	\N	2025-06-14	2025-12-14	{تولید,کود,NPK,شیمیایی}	[]	public	0	\N	2025-06-14 14:20:47.765543	2025-06-14 15:02:34.260795
2	پروتکل ایمنی آزمایشگاه	2	دستورالعمل‌های ایمنی در آزمایشگاه شیمی	# پروتکل ایمنی آزمایشگاه\n\n## تجهیزات ایمنی الزامی:\n- عینک ایمنی\n- دستکش مقاوم به مواد شیمیایی\n- روپوش آزمایشگاه\n- کفش بسته\n\n## قوانین کلی:\n1. هرگز تنها در آزمایشگاه کار نکنید\n2. مواد شیمیایی را از روی برچسب شناسایی کنید\n3. در صورت بروز حادثه، فوراً به مسئول اطلاع دهید\n4. پس از کار، دست‌ها را کاملاً بشویید\n\n## اقدامات اضطراری:\n- تلفن آتش‌نشانی: 125\n- تلفن اورژانس: 115\n- دوش اضطراری: کنار درب ورودی	1.5	approved	critical	fa	1	\N	\N	2025-06-14	2025-09-14	{ایمنی,آزمایشگاه,پروتکل}	[]	public	0	\N	2025-06-14 14:20:47.765543	2025-06-14 15:10:12.926647
4	تعمیرات دوره‌ای میکسر	4	برنامه نگهداری و تعمیرات میکسرهای تولید	# تعمیرات دوره‌ای میکسر\n\n## زمان‌بندی تعمیرات:\n- روزانه: بازرسی بصری\n- هفتگی: روغن‌کاری قطعات\n- ماهانه: تعویض فیلتر\n- سه‌ماهه: بازرسی کامل\n\n## ابزار مورد نیاز:\n- آچار رینگی 10-19\n- روغن صنعتی SAE 30\n- فیلتر هوا جدید\n- چراغ قوه\n\n## مراحل تعمیر:\n1. قطع برق دستگاه\n2. پاک‌کردن سطوح خارجی\n3. بررسی اتصالات\n4. روغن‌کاری بلبرینگ‌ها\n5. تست راه‌اندازی\n\n## چک‌لیست ایمنی:\n□ قطع کامل برق\n□ قفل ایمنی نصب شده\n□ تجهیزات ایمنی در دسترس	1.3	approved	normal	fa	1	\N	\N	2025-06-14	2026-06-14	{تعمیرات,میکسر,نگهداری}	[]	internal	0	\N	2025-06-14 14:20:47.765543	2025-06-14 15:15:25.258088
3	روش آزمایش کیفیت مواد خام	3	آزمایش‌های استاندارد برای کنترل کیفیت مواد خام	# آزمایش کیفیت مواد خام\n\n## تجهیزات مورد نیاز:\n- ترازو دقیق (0.01 گرم)\n- pH متر\n- ترمومتر\n- لوله‌های آزمایش\n\n## مراحل آزمایش:\n1. نمونه‌برداری تصادفی\n2. بررسی ظاهری (رنگ، بو، قوام)\n3. اندازه‌گیری pH\n4. تعیین رطوبت\n5. آزمایش خلوص\n6. تست استحکام\n\n## معیارهای قبولی:\n- pH: 6.5 - 7.5\n- رطوبت: کمتر از 2%\n- خلوص: بالای 95%\n\n## ثبت نتایج:\nنتایج در فرم QC-001 ثبت شود	1.8	approved	high	fa	1	\N	\N	2025-06-14	2025-10-14	{کیفیت,آزمایش,"مواد خام"}	[]	confidential	0	\N	2025-06-14 14:20:47.765543	2025-06-14 15:30:44.686873
5	سربرک	7	سربرک 	سربرک drgerg	1.0	draft	normal	fa	1	\N	\N	2025-06-06	2025-06-19	{}	[]	public	0	\N	2025-06-14 16:15:25.678941	2025-06-14 16:15:25.678941
6	استفاده از سربرگ رسمی در مکاتبات	7	استفاده از سربرگ رسمی در مکاتبات	استفاده از سربرگ رسمی در مکاتبات	1.0	draft	normal	fa	1	\N	\N	2025-06-14	2025-06-30	{}	[]	public	0	\N	2025-06-14 16:24:09.923179	2025-06-14 16:24:09.923179
\.


--
-- Data for Name: production_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.production_lines (id, name, description, capacity_per_hour, status, location, supervisor_name, created_at, updated_at) FROM stdin;
2	خط تولید ۲ - کودهای شیمیایی	تولید انواع کودهای NPK	200	active	سالن B	فاطمه احمدی	2025-06-14 14:05:05.073704	2025-06-14 14:05:05.073704
3	خط تولید ۳ - افزودنی‌های سوخت	تولید افزودنی‌های ضد یخ زدگی	100	maintenance	سالن C	علی رضایی	2025-06-14 14:05:05.073704	2025-06-14 14:05:05.073704
1	خط تولید اسید سولفوریک	خط تولید اسید سولفوریک با ظرفیت بالا برای صنایع شیمیایی	850	active	سالن A - بخش اسیدها	مهندس احمد رضایی	2025-06-14 14:05:05.073704	2025-06-14 14:05:05.073704
5	خط تولید کودهای شیمیایی	خط تولید کودهای مرکب NPK و اوره برای کشاورزی	1200	active	سالن B - بخش کودها	مهندس فاطمه کریمی	2025-06-14 19:12:20.519401	2025-06-14 19:12:20.519401
6	خط تولید مواد تصفیه آب	تولید کواگولانت ها و فلوکولانت های تصفیه آب	650	active	سالن C - بخش تصفیه	مهندس علی محمدی	2025-06-14 19:12:20.519401	2025-06-14 19:12:20.519401
7	خط تولید رنگ و پیگمنت	تولید رنگ های صنعتی و پیگمنت های معدنی	450	maintenance	سالن D - بخش رنگ	مهندس مریم اسماعیلی	2025-06-14 19:12:20.519401	2025-06-14 19:12:20.519401
8	خط تولید حلال ها	تولید حلال های آلی و الکل های صنعتی	750	active	سالن E - بخش حلال	مهندس حسین نوری	2025-06-14 19:12:20.519401	2025-06-14 19:12:20.519401
9	خط تولید افزودنی سوخت	تولید افزودنی های ضد یخ زدگی و بهبود دهنده سوخت	380	active	سالن F - بخش سوخت	مهندس زهرا حیدری	2025-06-14 19:12:20.519401	2025-06-14 19:12:20.519401
10	خط تولید شوینده های صنعتی	تولید شوینده های قوی برای صنایع مختلف	520	active	سالن G - بخش شوینده	مهندس محمد قاسمی	2025-06-14 19:12:20.519401	2025-06-14 19:12:20.519401
11	خط تولید مواد ضدعفونی	تولید محلول های ضدعفونی و استریلیزاسیون	600	active	سالن H - بخش ضدعفونی	مهندس سارا ملکی	2025-06-14 19:12:20.519401	2025-06-14 19:12:20.519401
\.


--
-- Data for Name: production_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.production_orders (id, order_number, product_name, quantity_planned, quantity_produced, unit, production_line_id, status, priority, planned_start_date, actual_start_date, planned_end_date, actual_end_date, supervisor_notes, quality_check_status, created_at, updated_at) FROM stdin;
6	PO-2025-001	اسید سولفوریک 98%	5000.00	4850.00	kg	1	completed	urgent	2025-06-10 08:00:00	2025-06-10 08:15:00	2025-06-10 18:00:00	2025-06-10 17:45:00	تولید با کیفیت استاندارد - آزمون های کنترل کیفی انجام شد	passed	2025-06-14 19:13:07.69474	2025-06-14 19:13:07.69474
21	PO-2025-002	کود NPK 20-20-20	8000.00	7950.00	kg	2	completed	normal	2025-06-11 06:00:00	2025-06-11 06:30:00	2025-06-11 20:00:00	2025-06-11 19:30:00	تولید موفقیت آمیز	passed	2025-06-14 19:14:30.531056	2025-06-14 19:14:30.531056
22	PO-2025-003	آلومینیوم سولفات	3200.00	3200.00	kg	3	completed	normal	2025-06-12 07:00:00	2025-06-12 07:20:00	2025-06-12 15:00:00	2025-06-12 14:45:00	تولید موفق	passed	2025-06-14 19:14:30.531056	2025-06-14 19:14:30.531056
23	PO-2025-004	رنگ اکسید آهن قرمز	1500.00	0.00	kg	5	on_hold	low	2025-06-13 09:00:00	\N	2025-06-13 17:00:00	\N	در انتظار تعمیر	pending	2025-06-14 19:14:30.531056	2025-06-14 19:14:30.531056
24	PO-2025-005	متانول 99.9%	2800.00	2650.00	L	6	in_progress	urgent	2025-06-14 08:00:00	2025-06-14 08:10:00	2025-06-14 16:00:00	\N	در حال تولید	pending	2025-06-14 19:14:30.531056	2025-06-14 19:14:30.531056
\.


--
-- Data for Name: production_recipes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.production_recipes (id, product_name, raw_material_id, quantity_required, unit, step_number, instructions, temperature, pressure, mixing_time, created_at) FROM stdin;
1	NPK Fertilizer Complex	1	20.00	kg	1	افزودن نیتروژن به مخزن اصلی	25.00	\N	15	2025-06-14 14:05:05.073704
2	NPK Fertilizer Complex	2	15.00	kg	2	افزودن فسفر و مخلوط کردن	30.00	\N	20	2025-06-14 14:05:05.073704
3	NPK Fertilizer Complex	3	10.00	kg	3	افزودن پتاسیم و همزدن نهایی	35.00	\N	25	2025-06-14 14:05:05.073704
4	Diesel Anti-Gel Additive	4	80.00	liter	1	افزودن اتیلن گلایکول	20.00	\N	10	2025-06-14 14:05:05.073704
5	Diesel Anti-Gel Additive	5	20.00	liter	2	افزودن متانول و مخلوط کردن	25.00	\N	15	2025-06-14 14:05:05.073704
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, category, description, short_description, price, price_unit, in_stock, stock_quantity, sku, image_url, pdf_catalog_url, specifications, features, applications, technical_data_sheet_url, safety_data_sheet_url, minimum_order_quantity, lead_time, is_active, created_at, updated_at) FROM stdin;
1	Diesel Fuel Additive DFA-100	fuel-additives	High-performance diesel fuel additive designed to improve fuel efficiency, reduce emissions, and enhance engine performance. Contains advanced detergent-dispersant technology and corrosion inhibitors.	Premium diesel additive for improved fuel efficiency and engine protection	25.50	per liter	t	150	DFA-100-1L	\N	\N	{"cetane_improver": "15-20 points", "detergent_level": "high", "corrosion_inhibitor": "included", "storage_stability": "24 months"}	["Improves fuel combustion", "Reduces emissions", "Prevents fuel system corrosion", "Enhances cold weather performance"]	["Heavy duty trucks", "Marine engines", "Industrial generators", "Agricultural machinery"]	\N	\N	20	5-7 days	t	2025-06-12 08:12:49.495726	2025-06-12 08:12:49.495726
2	Water Treatment Coagulant WTC-200	water-treatment	Polyaluminum chloride-based coagulant for municipal and industrial water treatment. Effective in removing suspended solids, turbidity, and organic contaminants from water sources.	Polyaluminum chloride coagulant for water purification	18.75	per kg	t	500	WTC-200-25KG	\N	\N	{"active_content": "30% Al2O3", "ph_range": "6.0-9.0", "solubility": "complete", "shelf_life": "18 months"}	["Fast coagulation", "Wide pH range", "Low residual aluminum", "Effective turbidity removal"]	["Municipal water treatment", "Industrial wastewater", "Swimming pool treatment", "Drinking water purification"]	\N	\N	50	3-5 days	t	2025-06-12 08:12:49.495726	2025-06-12 08:12:49.495726
3	Paint Thinner PT-300	paint-thinner	High-quality mineral spirits-based paint thinner suitable for oil-based paints, varnishes, and stains. Low odor formula with excellent solvency properties for professional and residential use.	Low-odor mineral spirits paint thinner for professional use	12.25	per liter	t	200	PT-300-4L	\N	\N	{"flash_point": "38°C", "distillation_range": "150-200°C", "aromatic_content": "<1%", "evaporation_rate": "medium"}	["Low odor formulation", "Excellent solvency", "Clean evaporation", "Professional grade"]	["Oil-based paints", "Varnishes and stains", "Equipment cleaning", "Paint preparation"]	\N	\N	12	2-4 days	t	2025-06-12 08:12:49.495726	2025-06-12 08:12:49.495726
4	NPK Fertilizer 20-20-20	agricultural-fertilizers	Balanced water-soluble NPK fertilizer with micronutrients. Ideal for field crops, greenhouse cultivation, and hydroponic systems. Contains chelated micronutrients for enhanced plant uptake.	Balanced NPK fertilizer with micronutrients for all crops	35.00	per 25kg bag	t	80	NPK-202020-25KG	\N	\N	{"nitrogen": "20%", "phosphorus": "20%", "potassium": "20%", "micronutrients": "chelated", "solubility": "100%"}	["Water soluble", "Balanced nutrition", "Chelated micronutrients", "Quick plant uptake"]	["Field crops", "Greenhouse cultivation", "Hydroponic systems", "Fruit and vegetables"]	\N	\N	10	7-10 days	t	2025-06-12 08:12:49.495726	2025-06-12 08:12:49.495726
5	Anuga	fuel-additives	DSF	SDFD	855.00	per liter	t	0				{}	[]	[]			1	7-14 days	t	2025-06-12 09:01:35.850415	2025-06-12 09:02:08.907
\.


--
-- Data for Name: quality_control; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quality_control (id, production_order_id, test_type, test_result, test_value, acceptable_range, test_status, tested_by, test_date, notes, created_at) FROM stdin;
\.


--
-- Data for Name: raw_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.raw_materials (id, name, code, unit, current_stock, minimum_stock, maximum_stock, unit_price, supplier, storage_location, expiry_date, quality_grade, created_at, updated_at) FROM stdin;
1	نیتروژن خالص	N2-001	kg	5000.00	1000.00	10000.00	2.50	شرکت پتروشیمی پارس	انبار A-1	\N	A	2025-06-14 14:05:05.073704	2025-06-14 14:05:05.073704
2	فسفر پنتاکساید	P2O5-002	kg	3000.00	500.00	8000.00	4.20	شرکت کیمیا صنعت	انبار A-2	\N	A	2025-06-14 14:05:05.073704	2025-06-14 14:05:05.073704
3	پتاسیم کلراید	KCL-003	kg	2500.00	500.00	6000.00	3.80	کانی‌های ایران	انبار B-1	\N	A	2025-06-14 14:05:05.073704	2025-06-14 14:05:05.073704
4	اتیلن گلایکول	EG-004	liter	1200.00	200.00	3000.00	5.50	پالایش نفت اصفهان	انبار C-1	\N	A	2025-06-14 14:05:05.073704	2025-06-14 14:05:05.073704
5	متانول	MEOH-005	liter	800.00	150.00	2000.00	3.20	پتروشیمی مهاباد	انبار C-2	\N	B	2025-06-14 14:05:05.073704	2025-06-14 14:05:05.073704
6	Sulfuric Acid 98%	SA-98	kg	15000.00	2000.00	25000.00	2.50	Iran Chemical Industries Co.	Zone A-1	2025-12-31	Industrial Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
7	Sodium Hydroxide (Caustic Soda)	NAOH-50	kg	8500.00	1500.00	15000.00	1.80	Pars Chemical Manufacturing	Zone A-2	2025-06-30	Technical Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
8	Phosphoric Acid 85%	PA-85	kg	12000.00	1800.00	20000.00	3.20	Tehran Phosphate Industries	Zone A-3	2026-03-15	Food Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
9	Ammonia Solution 25%	NH3-25	L	6800.00	1000.00	12000.00	2.10	Kurdistan Chemical Works	Zone B-1	2025-09-20	Industrial Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
10	Potassium Chloride	KCL-99	kg	22000.00	3000.00	35000.00	1.65	Urmia Salt Industries Ltd.	Zone C-1	2027-01-10	Agricultural Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
11	Calcium Carbonate	CACO3-95	kg	18500.00	2500.00	30000.00	0.85	Abadan Limestone Company	Zone C-2	2028-05-20	Industrial Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
12	Titanium Dioxide	TIO2-99	kg	4200.00	500.00	8000.00	8.50	Isfahan Pigment Industries	Zone D-1	2026-11-30	Cosmetic Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
13	Iron Oxide Red	FE2O3-R	kg	3800.00	600.00	7000.00	4.20	Bandar Abbas Iron Works	Zone D-2	2027-08-15	Paint Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
14	Methanol 99.9%	CH3OH-99	L	9500.00	1200.00	18000.00	1.95	Shiraz Petrochemical Complex	Zone E-1	2025-08-10	HPLC Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
15	Ethylene Glycol	EG-99	L	7200.00	1000.00	14000.00	2.75	Mahshahr Petrochemical Co.	Zone E-2	2026-02-28	Industrial Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
16	Urea 46%	UREA-46	kg	45000.00	5000.00	80000.00	1.20	Khorasan Fertilizer Company	Zone F-1	2026-12-25	Agricultural Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
17	Diammonium Phosphate	DAP-18	kg	28000.00	4000.00	50000.00	2.80	Fars Chemical Industries	Zone F-2	2025-10-05	Fertilizer Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
18	Sodium Chloride	NACL-99	kg	35000.00	5000.00	60000.00	0.45	Qom Salt Mining Corporation	Zone C-3	2028-01-15	Food Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
19	Hydrochloric Acid 37%	HCL-37	L	5500.00	800.00	10000.00	1.85	Tabriz Chemical Works Ltd.	Zone A-4	2025-11-12	Technical Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
20	Aluminum Sulfate	AL2SO4-17	kg	12500.00	2000.00	22000.00	1.95	Arak Aluminum Industries	Zone G-1	2027-04-30	Water Treatment Grade	2025-06-14 19:11:06.733762	2025-06-14 19:11:06.733762
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, role_id, permission_id, created_at) FROM stdin;
1	1	1	2025-06-14 11:19:52.036632
2	1	2	2025-06-14 11:19:52.036632
3	1	3	2025-06-14 11:19:52.036632
4	1	4	2025-06-14 11:19:52.036632
5	1	5	2025-06-14 11:19:52.036632
6	1	6	2025-06-14 11:19:52.036632
7	1	7	2025-06-14 11:19:52.036632
8	1	8	2025-06-14 11:19:52.036632
9	1	9	2025-06-14 11:19:52.036632
10	1	10	2025-06-14 11:19:52.036632
11	1	11	2025-06-14 11:19:52.036632
12	1	12	2025-06-14 11:19:52.036632
13	1	13	2025-06-14 11:19:52.036632
14	1	14	2025-06-14 11:19:52.036632
15	1	15	2025-06-14 11:19:52.036632
16	1	16	2025-06-14 11:19:52.036632
17	1	17	2025-06-14 11:19:52.036632
18	1	18	2025-06-14 11:19:52.036632
19	1	19	2025-06-14 11:19:52.036632
20	1	20	2025-06-14 11:19:52.036632
21	1	21	2025-06-14 11:19:52.036632
22	1	22	2025-06-14 11:19:52.036632
23	2	5	2025-06-14 11:19:52.036632
24	2	6	2025-06-14 11:19:52.036632
25	2	7	2025-06-14 11:19:52.036632
26	2	8	2025-06-14 11:19:52.036632
27	2	17	2025-06-14 11:19:52.036632
28	3	9	2025-06-14 11:19:52.036632
29	3	10	2025-06-14 11:19:52.036632
30	3	11	2025-06-14 11:19:52.036632
31	3	12	2025-06-14 11:19:52.036632
32	3	17	2025-06-14 11:19:52.036632
33	4	13	2025-06-14 11:19:52.036632
34	4	14	2025-06-14 11:19:52.036632
35	4	15	2025-06-14 11:19:52.036632
36	4	16	2025-06-14 11:19:52.036632
37	4	17	2025-06-14 11:19:52.036632
38	5	6	2025-06-14 11:19:52.036632
39	5	10	2025-06-14 11:19:52.036632
40	5	15	2025-06-14 11:19:52.036632
41	5	17	2025-06-14 11:19:52.036632
42	5	18	2025-06-14 11:19:52.036632
43	5	19	2025-06-14 11:19:52.036632
44	6	6	2025-06-14 11:19:52.036632
45	6	10	2025-06-14 11:19:52.036632
46	6	20	2025-06-14 11:19:52.036632
47	6	21	2025-06-14 11:19:52.036632
48	6	22	2025-06-14 11:19:52.036632
\.


--
-- Data for Name: safety_protocols; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.safety_protocols (id, title, category, description, severity_level, required_ppe, emergency_contacts, procedures, first_aid_steps, evacuation_plan, is_mandatory, compliance_notes, last_updated_by, created_at, updated_at) FROM stdin;
1	پروتکل آتش‌سوزی	اضطراری	اقدامات در صورت بروز آتش‌سوزی	critical	{"ماسک دود","دستکش حرارتی"}	[]	1. فوراً آژیر خطر را فعال کنید\n2. از نزدیک‌ترین خروجی اضطراری خارج شوید\n3. در نقطه تجمع منتظر بمانید\n4. با آتش‌نشانی تماس بگیرید	در صورت سوختگی: آب سرد روی محل بریزید و فوراً به پزشک مراجعه کنید	\N	t	\N	\N	2025-06-14 14:20:47.765543	2025-06-14 14:20:47.765543
2	ایمنی مواد شیمیایی	حفاظتی	نحوه کار ایمن با مواد شیمیایی	high	{"دستکش شیمیایی","عینک ایمنی","ماسک فیلتردار"}	[]	1. همیشه برچسب مواد را بخوانید\n2. در محل تهویه مناسب کار کنید\n3. مواد را در ظروف مناسب نگهداری کنید\n4. پس از کار دست‌ها را بشویید	در صورت تماس با چشم: 15 دقیقه با آب فراوان شستشو دهید	\N	t	\N	\N	2025-06-14 14:20:47.765543	2025-06-14 14:20:47.765543
\.


--
-- Data for Name: sales_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_reports (id, report_date, report_type, total_sales, total_refunds, total_returns, net_revenue, order_count, refund_count, return_count, average_order_value, top_selling_products, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shop_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shop_categories (id, name, slug, description, image_url, parent_id, is_active, display_order, meta_title, meta_description, created_at, updated_at) FROM stdin;
1	Water Treatment	water-treatment	Professional water treatment chemicals and solutions	\N	\N	t	1	\N	\N	2025-06-13 01:50:47.257527	2025-06-13 01:50:47.257527
2	Fuel Additives	fuel-additives	High-performance fuel system cleaners and additives	\N	\N	t	2	\N	\N	2025-06-13 01:50:47.257527	2025-06-13 01:50:47.257527
3	Paint & Solvents	paint-solvents	Industrial paint thinners and solvents	\N	\N	t	3	\N	\N	2025-06-13 01:50:47.257527	2025-06-13 01:50:47.257527
4	Agricultural	agricultural	Fertilizers and agricultural chemicals	\N	\N	t	4	\N	\N	2025-06-13 01:50:47.257527	2025-06-13 01:50:47.257527
\.


--
-- Data for Name: shop_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shop_products (id, name, category, description, short_description, price, compare_at_price, price_unit, in_stock, stock_quantity, low_stock_threshold, sku, barcode, weight, weight_unit, dimensions, image_urls, thumbnail_url, specifications, features, applications, tags, minimum_order_quantity, maximum_order_quantity, lead_time, shipping_class, tax_class, is_active, is_featured, meta_title, meta_description, created_at, updated_at, quantity_discounts) FROM stdin;
1	Industrial Water Clarifier WC-500	water-treatment	High-performance water clarifying agent for industrial applications. Removes suspended particles and turbidity effectively.	Professional water clarifier for industrial use	45.99	\N	per 5L	t	24	10	WC-500-5L	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 01:59:12.64	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
2	Pool Chlorine Stabilizer CS-100	water-treatment	Cyanuric acid-based stabilizer that protects chlorine from UV degradation in swimming pools and water systems.	UV-resistant chlorine stabilizer	32.50	\N	per 10kg	t	39	10	CS-100-10KG	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 02:01:50.083	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
6	NPK Fertilizer Complex 20-10-10	agricultural	Balanced NPK fertilizer with nitrogen, phosphorus, and potassium for optimal plant growth and yield.	Balanced NPK fertilizer complex	65.00	\N	per 25kg	t	-7	10	NPK-201010-25KG	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 02:34:25.517	[\n  {"minQty": 5, "discount": 0.03},\n  {"minQty": 20, "discount": 0.08},\n  {"minQty": 100, "discount": 0.20}\n]
3	Fuel System Cleaner Premium FSC-Pro	fuel-additives	Advanced fuel injector cleaner that removes carbon deposits and improves engine performance. Compatible with gasoline and diesel.	Premium fuel system cleaner	28.75	\N	per 500ml	t	57	10	FSC-PRO-500ML	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-14 09:31:14.542	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
4	Diesel Anti-Gel Additive DAG-Winter	fuel-additives	Prevents fuel gelling in cold weather conditions. Improves cold flow properties of diesel fuel.	Winter diesel anti-gel protection	15.25	\N	per 250ml	t	-22	5	DAG-WINTER-250ML	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-14 09:34:50.592	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
16	محصول تست لیزر اسکنر	chemicals	محصول تستی برای آزمایش لیزر اسکنر USB	\N	250.00	\N	per unit	t	100	20	USB-TEST-001	1234567890123	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-14 10:07:14.379112	2025-06-14 10:07:14.379112	\N
5	Paint Thinner Professional PT-Grade	paint-solvents	High-quality paint thinner for professional painting applications. Fast-evaporating and residue-free.	Professional grade paint thinner	22.00	\N	per 1L	t	0	5	PT-GRADE-1L	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 01:50:58.996872	\N
13	NPK Fertilizer Complex	agricultural-fertilizers	Balanced NPK fertilizer for optimal crop growth	\N	50.00	\N	unit	t	75	15	SP-4-NPK-FERTIL	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-16 15:41:36.05	\N
14	Fuel System Cleaner Pro	fuel-additives	Advanced fuel system cleaner that removes deposits and improves engine performance	\N	50.00	\N	unit	t	150	20	SP-1-FUEL-SYSTE	\N	\N	kg	\N	["/uploads/images/product-1749823118120-593693181.jpeg"]	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-16 15:41:36.181	\N
12	Premium Paint Thinner	paint-thinner	Professional grade paint thinner for industrial use	\N	50.00	\N	unit	t	0	30	SP-3-PREMIUM-PA	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-16 15:41:36.228	\N
15	Water Treatment Chemical A1	water-treatment	High-quality water treatment solution for industrial applications	\N	50.00	\N	unit	t	16	25	SP-2-WATER-TREA	\N	\N	kg	\N	["/uploads/images/product-1749822983330-60758320.jpeg"]	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-16 15:41:36.277	\N
\.


--
-- Data for Name: showcase_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.showcase_products (id, name, category, description, short_description, price_range, image_url, pdf_catalog_url, specifications, features, applications, technical_data_sheet_url, safety_data_sheet_url, certifications, is_active, display_order, created_at, updated_at, stock_quantity, min_stock_level, max_stock_level, stock_unit, inventory_status, last_restock_date, supplier, warehouse_location, batch_number, expiry_date, barcode, qr_code, sku) FROM stdin;
4	NPK Fertilizer Complex	agricultural-fertilizers	Balanced NPK fertilizer for optimal crop growth	Balanced NPK fertilizer	Contact for pricing	\N	\N	{}	{}	{}	\N	\N	{}	t	4	2025-06-12 15:01:26.313404	2025-06-12 15:01:26.313404	75	15	400	kg	in_stock	\N	AgriChem Ltd	Erbil Main Warehouse	AG2024004	\N	\N	\N	\N
1	Fuel System Cleaner Pro	fuel-additives	Advanced fuel system cleaner that removes deposits and improves engine performance	Professional grade fuel system cleaner	Contact for pricing	/uploads/images/product-1749823118120-593693181.jpeg		\N	\N	\N			\N	t	1	2025-06-12 15:01:26.313404	2025-06-13 13:58:39.713	150	20	500	liters	in_stock	\N	ChemCorp Industries	Erbil Main Warehouse	FC2024001	\N	\N	\N	\N
3	Premium Paint Thinner	paint-thinner	Professional grade paint thinner for industrial use	Industrial paint thinner	Contact for pricing	\N	\N	{}	{}	{}	\N	\N	{}	t	3	2025-06-12 15:01:26.313404	2025-06-13 18:20:35.116	0	30	200	liters	out_of_stock	\N	PaintTech Industries	Erbil Storage B	PT2024003	\N	0000000003	\N	SKU0003
2	Water Treatment Chemical A1	water-treatment	High-quality water treatment solution for industrial applications	Industrial water treatment solution	Contact for pricing	/uploads/images/product-1749822983330-60758320.jpeg		\N	\N	\N			\N	t	2	2025-06-12 15:01:26.313404	2025-06-13 19:03:24.105	16	25	300	liters	low_stock	\N	AquaTech Solutions	Erbil Main Warehouse	WT2024002	\N	\N	\N	\N
\.


--
-- Data for Name: smtp_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.smtp_settings (id, category_id, host, port, secure, username, password, from_name, from_email, is_active, test_status, last_tested, created_at, updated_at) FROM stdin;
1	1	smtppro.zoho.eu	587	t	info@momtazchem.com	RkBTW6W7Qqt7	Momtaz Chemical	info@momtazchem.com	t	success	2025-06-16 19:18:30.616	2025-06-14 07:44:49.94626	2025-06-16 19:18:43.837
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password_hash, is_active, created_at, updated_at, role_id, last_login_at) FROM stdin;
2	mr.ghafari@gmail.com	mr.ghafari@gmail.com	$2b$10$TJxSF7dZFwF2iOCI2is/EO4ExLAlRA/0DzSTO9.EtuRZLh7tF1O1G	t	2025-06-13 02:42:47.07026	2025-06-13 04:33:43.174	\N	\N
3	products_manager	products@momtazchem.com	$2b$12$test.hash.example.for.demo.purposes.only	t	2025-06-14 11:46:13.788359	2025-06-14 11:46:13.788359	2	\N
4	crm_manager	crm@momtazchem.com	$2b$12$test.hash.example.for.demo.purposes.only	t	2025-06-14 11:46:13.788359	2025-06-14 11:46:13.788359	3	\N
5	shop_manager	shop@momtazchem.com	$2b$12$test.hash.example.for.demo.purposes.only	t	2025-06-14 11:46:13.788359	2025-06-14 11:46:13.788359	4	\N
1	info@momtazchem.com	info@momtazchem.com	$2b$12$UhfmP.8rZF9M/2qWJfP0DeiHjb.1QK3mfp5//ZfiWSlj3TGZshoxe	t	2025-06-12 08:17:29.164005	2025-06-12 08:17:29.164005	1	\N
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, false);


--
-- Name: admin_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_permissions_id_seq', 22, true);


--
-- Name: admin_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_roles_id_seq', 6, true);


--
-- Name: certifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.certifications_id_seq', 1, false);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contacts_id_seq', 29, true);


--
-- Name: crm_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.crm_customers_id_seq', 7, true);


--
-- Name: customer_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_activities_id_seq', 72, true);


--
-- Name: customer_inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_inquiries_id_seq', 8, true);


--
-- Name: customer_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_orders_id_seq', 20, true);


--
-- Name: customer_segments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_segments_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 4, true);


--
-- Name: discount_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.discount_settings_id_seq', 3, true);


--
-- Name: email_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_categories_id_seq', 7, true);


--
-- Name: email_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_logs_id_seq', 29, true);


--
-- Name: email_recipients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_recipients_id_seq', 10, true);


--
-- Name: email_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_templates_id_seq', 3, true);


--
-- Name: equipment_maintenance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipment_maintenance_id_seq', 13, true);


--
-- Name: financial_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.financial_transactions_id_seq', 14, true);


--
-- Name: inventory_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_movements_id_seq', 1, false);


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 15, true);


--
-- Name: lead_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lead_activities_id_seq', 7, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leads_id_seq', 7, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_items_id_seq', 37, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 11, true);


--
-- Name: password_resets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_resets_id_seq', 1, true);


--
-- Name: procedure_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedure_categories_id_seq', 7, true);


--
-- Name: procedure_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedure_documents_id_seq', 17, true);


--
-- Name: procedure_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedure_feedback_id_seq', 1, false);


--
-- Name: procedure_outlines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedure_outlines_id_seq', 13, true);


--
-- Name: procedure_revisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedure_revisions_id_seq', 1, false);


--
-- Name: procedure_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedure_steps_id_seq', 3, true);


--
-- Name: procedure_training_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedure_training_id_seq', 1, false);


--
-- Name: procedures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedures_id_seq', 6, true);


--
-- Name: production_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.production_lines_id_seq', 11, true);


--
-- Name: production_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.production_orders_id_seq', 24, true);


--
-- Name: production_recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.production_recipes_id_seq', 5, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 6, true);


--
-- Name: quality_control_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quality_control_id_seq', 1, false);


--
-- Name: raw_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.raw_materials_id_seq', 20, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 48, true);


--
-- Name: safety_protocols_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.safety_protocols_id_seq', 2, true);


--
-- Name: sales_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_reports_id_seq', 1, false);


--
-- Name: shop_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shop_categories_id_seq', 4, true);


--
-- Name: shop_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shop_products_id_seq', 16, true);


--
-- Name: showcase_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.showcase_products_id_seq', 5, true);


--
-- Name: smtp_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.smtp_settings_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: admin_permissions admin_permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_name_key UNIQUE (name);


--
-- Name: admin_permissions admin_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_pkey PRIMARY KEY (id);


--
-- Name: admin_roles admin_roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_name_key UNIQUE (name);


--
-- Name: admin_roles admin_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_pkey PRIMARY KEY (id);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: crm_customers crm_customers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_customers
    ADD CONSTRAINT crm_customers_email_key UNIQUE (email);


--
-- Name: crm_customers crm_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_customers
    ADD CONSTRAINT crm_customers_pkey PRIMARY KEY (id);


--
-- Name: customer_activities customer_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_activities
    ADD CONSTRAINT customer_activities_pkey PRIMARY KEY (id);


--
-- Name: customer_inquiries customer_inquiries_inquiry_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_inquiries
    ADD CONSTRAINT customer_inquiries_inquiry_number_key UNIQUE (inquiry_number);


--
-- Name: customer_inquiries customer_inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_inquiries
    ADD CONSTRAINT customer_inquiries_pkey PRIMARY KEY (id);


--
-- Name: customer_orders customer_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_orders
    ADD CONSTRAINT customer_orders_order_number_key UNIQUE (order_number);


--
-- Name: customer_orders customer_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_orders
    ADD CONSTRAINT customer_orders_pkey PRIMARY KEY (id);


--
-- Name: customer_segments customer_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_segments
    ADD CONSTRAINT customer_segments_pkey PRIMARY KEY (id);


--
-- Name: customers customers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: discount_settings discount_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_settings
    ADD CONSTRAINT discount_settings_pkey PRIMARY KEY (id);


--
-- Name: email_categories email_categories_category_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_categories
    ADD CONSTRAINT email_categories_category_key_key UNIQUE (category_key);


--
-- Name: email_categories email_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_categories
    ADD CONSTRAINT email_categories_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_recipients email_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_recipients
    ADD CONSTRAINT email_recipients_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: equipment_maintenance equipment_maintenance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_maintenance
    ADD CONSTRAINT equipment_maintenance_pkey PRIMARY KEY (id);


--
-- Name: financial_transactions financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_token_key UNIQUE (token);


--
-- Name: procedure_categories procedure_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_categories
    ADD CONSTRAINT procedure_categories_pkey PRIMARY KEY (id);


--
-- Name: procedure_documents procedure_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_documents
    ADD CONSTRAINT procedure_documents_pkey PRIMARY KEY (id);


--
-- Name: procedure_feedback procedure_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_feedback
    ADD CONSTRAINT procedure_feedback_pkey PRIMARY KEY (id);


--
-- Name: procedure_outlines procedure_outlines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_outlines
    ADD CONSTRAINT procedure_outlines_pkey PRIMARY KEY (id);


--
-- Name: procedure_revisions procedure_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_revisions
    ADD CONSTRAINT procedure_revisions_pkey PRIMARY KEY (id);


--
-- Name: procedure_steps procedure_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_steps
    ADD CONSTRAINT procedure_steps_pkey PRIMARY KEY (id);


--
-- Name: procedure_training procedure_training_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_training
    ADD CONSTRAINT procedure_training_pkey PRIMARY KEY (id);


--
-- Name: procedures procedures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_pkey PRIMARY KEY (id);


--
-- Name: production_lines production_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_lines
    ADD CONSTRAINT production_lines_pkey PRIMARY KEY (id);


--
-- Name: production_orders production_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_orders
    ADD CONSTRAINT production_orders_order_number_key UNIQUE (order_number);


--
-- Name: production_orders production_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_orders
    ADD CONSTRAINT production_orders_pkey PRIMARY KEY (id);


--
-- Name: production_recipes production_recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_recipes
    ADD CONSTRAINT production_recipes_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: quality_control quality_control_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_control
    ADD CONSTRAINT quality_control_pkey PRIMARY KEY (id);


--
-- Name: raw_materials raw_materials_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raw_materials
    ADD CONSTRAINT raw_materials_code_key UNIQUE (code);


--
-- Name: raw_materials raw_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.raw_materials
    ADD CONSTRAINT raw_materials_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: safety_protocols safety_protocols_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_protocols
    ADD CONSTRAINT safety_protocols_pkey PRIMARY KEY (id);


--
-- Name: sales_reports sales_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_reports
    ADD CONSTRAINT sales_reports_pkey PRIMARY KEY (id);


--
-- Name: shop_categories shop_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_categories
    ADD CONSTRAINT shop_categories_pkey PRIMARY KEY (id);


--
-- Name: shop_categories shop_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_categories
    ADD CONSTRAINT shop_categories_slug_key UNIQUE (slug);


--
-- Name: shop_products shop_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT shop_products_pkey PRIMARY KEY (id);


--
-- Name: shop_products shop_products_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT shop_products_sku_key UNIQUE (sku);


--
-- Name: showcase_products showcase_products_barcode_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.showcase_products
    ADD CONSTRAINT showcase_products_barcode_key UNIQUE (barcode);


--
-- Name: showcase_products showcase_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.showcase_products
    ADD CONSTRAINT showcase_products_pkey PRIMARY KEY (id);


--
-- Name: showcase_products showcase_products_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.showcase_products
    ADD CONSTRAINT showcase_products_sku_key UNIQUE (sku);


--
-- Name: smtp_settings smtp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smtp_settings
    ADD CONSTRAINT smtp_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: email_logs email_logs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.email_categories(id);


--
-- Name: email_logs email_logs_smtp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_smtp_id_fkey FOREIGN KEY (smtp_id) REFERENCES public.smtp_settings(id);


--
-- Name: email_logs email_logs_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.email_templates(id);


--
-- Name: email_recipients email_recipients_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_recipients
    ADD CONSTRAINT email_recipients_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.email_categories(id);


--
-- Name: equipment_maintenance equipment_maintenance_production_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_maintenance
    ADD CONSTRAINT equipment_maintenance_production_line_id_fkey FOREIGN KEY (production_line_id) REFERENCES public.production_lines(id);


--
-- Name: financial_transactions financial_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: inventory_movements inventory_movements_raw_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_raw_material_id_fkey FOREIGN KEY (raw_material_id) REFERENCES public.raw_materials(id);


--
-- Name: procedure_documents procedure_documents_outline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_documents
    ADD CONSTRAINT procedure_documents_outline_id_fkey FOREIGN KEY (outline_id) REFERENCES public.procedure_outlines(id);


--
-- Name: procedure_documents procedure_documents_procedure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_documents
    ADD CONSTRAINT procedure_documents_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedures(id) ON DELETE CASCADE;


--
-- Name: procedure_documents procedure_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_documents
    ADD CONSTRAINT procedure_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: procedure_feedback procedure_feedback_procedure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_feedback
    ADD CONSTRAINT procedure_feedback_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedures(id) ON DELETE CASCADE;


--
-- Name: procedure_feedback procedure_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_feedback
    ADD CONSTRAINT procedure_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: procedure_outlines procedure_outlines_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_outlines
    ADD CONSTRAINT procedure_outlines_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.procedure_outlines(id);


--
-- Name: procedure_outlines procedure_outlines_procedure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_outlines
    ADD CONSTRAINT procedure_outlines_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedures(id) ON DELETE CASCADE;


--
-- Name: procedure_revisions procedure_revisions_procedure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_revisions
    ADD CONSTRAINT procedure_revisions_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedures(id) ON DELETE CASCADE;


--
-- Name: procedure_revisions procedure_revisions_revised_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_revisions
    ADD CONSTRAINT procedure_revisions_revised_by_fkey FOREIGN KEY (revised_by) REFERENCES public.users(id);


--
-- Name: procedure_steps procedure_steps_procedure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_steps
    ADD CONSTRAINT procedure_steps_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedures(id) ON DELETE CASCADE;


--
-- Name: procedure_training procedure_training_procedure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_training
    ADD CONSTRAINT procedure_training_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedures(id);


--
-- Name: procedure_training procedure_training_trainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_training
    ADD CONSTRAINT procedure_training_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id);


--
-- Name: procedure_training procedure_training_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedure_training
    ADD CONSTRAINT procedure_training_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: procedures procedures_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: procedures procedures_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: procedures procedures_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedures
    ADD CONSTRAINT procedures_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.procedure_categories(id);


--
-- Name: production_orders production_orders_production_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_orders
    ADD CONSTRAINT production_orders_production_line_id_fkey FOREIGN KEY (production_line_id) REFERENCES public.production_lines(id);


--
-- Name: production_recipes production_recipes_raw_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_recipes
    ADD CONSTRAINT production_recipes_raw_material_id_fkey FOREIGN KEY (raw_material_id) REFERENCES public.raw_materials(id);


--
-- Name: quality_control quality_control_production_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_control
    ADD CONSTRAINT quality_control_production_order_id_fkey FOREIGN KEY (production_order_id) REFERENCES public.production_orders(id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.admin_permissions(id);


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.admin_roles(id);


--
-- Name: safety_protocols safety_protocols_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_protocols
    ADD CONSTRAINT safety_protocols_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES public.users(id);


--
-- Name: smtp_settings smtp_settings_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smtp_settings
    ADD CONSTRAINT smtp_settings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.email_categories(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.admin_roles(id);


--
-- PostgreSQL database dump complete
--

