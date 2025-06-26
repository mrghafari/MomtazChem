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
    created_by text DEFAULT 'system'::text,
    password_hash text,
    sms_enabled boolean DEFAULT true
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
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_addresses (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    title text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    company text,
    phone text NOT NULL,
    country text NOT NULL,
    state text,
    city text NOT NULL,
    address text NOT NULL,
    postal_code text,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    recipient_name text DEFAULT ''::text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    location_accuracy numeric(6,2)
);


--
-- Name: customer_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_addresses_id_seq OWNED BY public.customer_addresses.id;


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
-- Name: customer_sms_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_sms_settings (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    sms_auth_enabled boolean DEFAULT false,
    enabled_by text,
    enabled_at timestamp without time zone,
    disabled_by text,
    disabled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_sms_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_sms_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_sms_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_sms_settings_id_seq OWNED BY public.customer_sms_settings.id;


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
    reset_password_expires timestamp without time zone,
    alternate_phone character varying(50),
    state character varying(100),
    date_of_birth date,
    industry text,
    business_type text,
    company_size text,
    customer_type text DEFAULT 'retail'::text,
    customer_status text DEFAULT 'active'::text,
    customer_source text DEFAULT 'website'::text,
    total_orders_count integer DEFAULT 0,
    average_order_value numeric(10,2) DEFAULT 0,
    first_order_date timestamp without time zone,
    communication_preference text DEFAULT 'email'::text,
    preferred_language text DEFAULT 'en'::text,
    marketing_consent boolean DEFAULT false,
    product_interests json,
    credit_limit numeric(10,2),
    payment_terms text DEFAULT 'immediate'::text,
    preferred_payment_method text,
    assigned_sales_rep text,
    tags json,
    internal_notes text,
    lead_score integer DEFAULT 0,
    lead_status text DEFAULT 'new'::text,
    segment_id integer,
    referral_source text,
    acquisition_cost numeric(10,2),
    lifetime_value numeric(10,2),
    last_contact_date timestamp without time zone,
    next_follow_up_date timestamp without time zone,
    public_notes text
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
-- Name: dashboard_widgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_widgets (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(200) NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    icon_name character varying(50) DEFAULT 'BarChart3'::character varying,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 0,
    min_user_level character varying(20) DEFAULT 'admin'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: dashboard_widgets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dashboard_widgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dashboard_widgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dashboard_widgets_id_seq OWNED BY public.dashboard_widgets.id;


--
-- Name: delivery_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_codes (
    id integer NOT NULL,
    order_management_id integer NOT NULL,
    code character varying(6) NOT NULL,
    is_used boolean DEFAULT false,
    used_at timestamp without time zone,
    verified_by text,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: delivery_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.delivery_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: delivery_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.delivery_codes_id_seq OWNED BY public.delivery_codes.id;


--
-- Name: department_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.department_assignments (
    id integer NOT NULL,
    admin_user_id integer NOT NULL,
    department character varying(20) NOT NULL,
    is_active boolean DEFAULT true,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL,
    assigned_by integer
);


--
-- Name: department_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.department_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: department_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.department_assignments_id_seq OWNED BY public.department_assignments.id;


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
-- Name: inquiry_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inquiry_responses (
    id integer NOT NULL,
    inquiry_id integer NOT NULL,
    sender_id integer,
    sender_type text DEFAULT 'admin'::text NOT NULL,
    message text NOT NULL,
    attachments json,
    is_internal boolean DEFAULT false,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: inquiry_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inquiry_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inquiry_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inquiry_responses_id_seq OWNED BY public.inquiry_responses.id;


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
-- Name: multilingual_keywords; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.multilingual_keywords (
    id integer NOT NULL,
    seo_setting_id integer NOT NULL,
    keyword text NOT NULL,
    language text NOT NULL,
    search_volume integer DEFAULT 0,
    difficulty integer DEFAULT 0,
    current_position integer,
    target_position integer DEFAULT 1,
    is_tracking boolean DEFAULT true,
    last_checked timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: multilingual_keywords_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.multilingual_keywords_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: multilingual_keywords_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.multilingual_keywords_id_seq OWNED BY public.multilingual_keywords.id;


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
-- Name: order_management; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_management (
    id integer NOT NULL,
    customer_order_id integer NOT NULL,
    current_status character varying(50) DEFAULT 'pending_payment'::character varying NOT NULL,
    delivery_code character varying(10),
    financial_reviewer_id integer,
    financial_reviewed_at timestamp without time zone,
    financial_notes text,
    payment_receipt_url text,
    warehouse_assignee_id integer,
    warehouse_processed_at timestamp without time zone,
    warehouse_notes text,
    logistics_assignee_id integer,
    logistics_processed_at timestamp without time zone,
    logistics_notes text,
    tracking_number character varying(100),
    estimated_delivery_date timestamp without time zone,
    actual_delivery_date timestamp without time zone,
    delivery_person_name text,
    delivery_person_phone text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: order_management_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_management_id_seq OWNED BY public.order_management.id;


--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_status_history (
    id integer NOT NULL,
    order_management_id integer NOT NULL,
    from_status character varying(50),
    to_status character varying(50) NOT NULL,
    changed_by integer,
    changed_by_department character varying(20),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: order_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_status_history_id_seq OWNED BY public.order_status_history.id;


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
-- Name: payment_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_receipts (
    id integer NOT NULL,
    customer_order_id integer NOT NULL,
    customer_id integer NOT NULL,
    receipt_url text NOT NULL,
    original_file_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type character varying(100) NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL,
    notes text
);


--
-- Name: payment_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_receipts_id_seq OWNED BY public.payment_receipts.id;


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
-- Name: redirects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redirects (
    id integer NOT NULL,
    from_url text NOT NULL,
    to_url text NOT NULL,
    status_code integer DEFAULT 301,
    is_active boolean DEFAULT true,
    hit_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: redirects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.redirects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: redirects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.redirects_id_seq OWNED BY public.redirects.id;


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
-- Name: seo_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_analytics (
    id integer NOT NULL,
    seo_setting_id integer NOT NULL,
    page_url text NOT NULL,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    "position" numeric(10,2),
    ctr numeric(5,4),
    date_recorded timestamp without time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'manual'::text,
    language text DEFAULT 'fa'::text NOT NULL,
    country text,
    device text DEFAULT 'desktop'::text
);


--
-- Name: seo_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seo_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seo_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seo_analytics_id_seq OWNED BY public.seo_analytics.id;


--
-- Name: seo_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_settings (
    id integer NOT NULL,
    page_type text NOT NULL,
    page_identifier text,
    title text NOT NULL,
    description text NOT NULL,
    keywords text,
    og_title text,
    og_description text,
    og_image text,
    twitter_title text,
    twitter_description text,
    twitter_image text,
    canonical_url text,
    robots text DEFAULT 'index,follow'::text,
    schema json,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    language text DEFAULT 'fa'::text NOT NULL,
    hreflang_url text
);


--
-- Name: seo_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seo_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seo_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seo_settings_id_seq OWNED BY public.seo_settings.id;


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
    sku text,
    unit_price numeric(10,2) DEFAULT 0.00,
    currency text DEFAULT 'USD'::text
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
-- Name: sitemap_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sitemap_entries (
    id integer NOT NULL,
    url text NOT NULL,
    priority numeric(3,2) DEFAULT 0.5,
    change_freq text DEFAULT 'weekly'::text,
    last_modified timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true,
    page_type text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    language text DEFAULT 'fa'::text NOT NULL
);


--
-- Name: sitemap_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sitemap_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sitemap_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sitemap_entries_id_seq OWNED BY public.sitemap_entries.id;


--
-- Name: sms_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_settings (
    id integer NOT NULL,
    is_enabled boolean DEFAULT false,
    provider text DEFAULT 'twilio'::text,
    api_key text,
    api_secret text,
    sender_number text,
    code_length integer DEFAULT 6,
    code_expiry integer DEFAULT 300,
    max_attempts integer DEFAULT 3,
    rate_limit_minutes integer DEFAULT 60,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sms_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sms_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sms_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sms_settings_id_seq OWNED BY public.sms_settings.id;


--
-- Name: sms_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_verifications (
    id integer NOT NULL,
    phone text NOT NULL,
    code text NOT NULL,
    purpose text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_used boolean DEFAULT false,
    attempts integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sms_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sms_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sms_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sms_verifications_id_seq OWNED BY public.sms_verifications.id;


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
-- Name: super_admin_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.super_admin_verifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    email text NOT NULL,
    phone text,
    verification_code text NOT NULL,
    type text NOT NULL,
    is_used boolean DEFAULT false,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: super_admin_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.super_admin_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: super_admin_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.super_admin_verifications_id_seq OWNED BY public.super_admin_verifications.id;


--
-- Name: supported_languages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supported_languages (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    native_name text NOT NULL,
    direction text DEFAULT 'rtl'::text NOT NULL,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 0,
    google_analytics_code text,
    search_console_property text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: supported_languages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supported_languages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: supported_languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supported_languages_id_seq OWNED BY public.supported_languages.id;


--
-- Name: user_widget_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_widget_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    widget_id integer NOT NULL,
    is_visible boolean DEFAULT true,
    "position" integer DEFAULT 0,
    size character varying(20) DEFAULT 'medium'::character varying,
    custom_settings jsonb DEFAULT '{}'::jsonb,
    last_accessed_at timestamp without time zone,
    access_count integer DEFAULT 0,
    is_starred boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_widget_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_widget_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_widget_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_widget_preferences_id_seq OWNED BY public.user_widget_preferences.id;


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
    last_login_at timestamp without time zone,
    phone text,
    email_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false,
    department text
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
-- Name: widget_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.widget_recommendations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    widget_id integer NOT NULL,
    score numeric(5,2) DEFAULT 0.00 NOT NULL,
    reason character varying(50) NOT NULL,
    explanation text,
    is_accepted boolean,
    is_dismissed boolean DEFAULT false,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: widget_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.widget_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: widget_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.widget_recommendations_id_seq OWNED BY public.widget_recommendations.id;


--
-- Name: widget_usage_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.widget_usage_analytics (
    id integer NOT NULL,
    user_id integer NOT NULL,
    widget_id integer NOT NULL,
    action character varying(50) NOT NULL,
    duration integer,
    session_id character varying(100),
    user_agent text,
    ip_address inet,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: widget_usage_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.widget_usage_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: widget_usage_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.widget_usage_analytics_id_seq OWNED BY public.widget_usage_analytics.id;


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
-- Name: customer_addresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses ALTER COLUMN id SET DEFAULT nextval('public.customer_addresses_id_seq'::regclass);


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
-- Name: customer_sms_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_sms_settings ALTER COLUMN id SET DEFAULT nextval('public.customer_sms_settings_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: dashboard_widgets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_widgets ALTER COLUMN id SET DEFAULT nextval('public.dashboard_widgets_id_seq'::regclass);


--
-- Name: delivery_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_codes ALTER COLUMN id SET DEFAULT nextval('public.delivery_codes_id_seq'::regclass);


--
-- Name: department_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_assignments ALTER COLUMN id SET DEFAULT nextval('public.department_assignments_id_seq'::regclass);


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
-- Name: inquiry_responses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_responses ALTER COLUMN id SET DEFAULT nextval('public.inquiry_responses_id_seq'::regclass);


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
-- Name: multilingual_keywords id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multilingual_keywords ALTER COLUMN id SET DEFAULT nextval('public.multilingual_keywords_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: order_management id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_management ALTER COLUMN id SET DEFAULT nextval('public.order_management_id_seq'::regclass);


--
-- Name: order_status_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history ALTER COLUMN id SET DEFAULT nextval('public.order_status_history_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: payment_receipts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_receipts ALTER COLUMN id SET DEFAULT nextval('public.payment_receipts_id_seq'::regclass);


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
-- Name: redirects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redirects ALTER COLUMN id SET DEFAULT nextval('public.redirects_id_seq'::regclass);


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
-- Name: seo_analytics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_analytics ALTER COLUMN id SET DEFAULT nextval('public.seo_analytics_id_seq'::regclass);


--
-- Name: seo_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_settings ALTER COLUMN id SET DEFAULT nextval('public.seo_settings_id_seq'::regclass);


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
-- Name: sitemap_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_entries ALTER COLUMN id SET DEFAULT nextval('public.sitemap_entries_id_seq'::regclass);


--
-- Name: sms_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_settings ALTER COLUMN id SET DEFAULT nextval('public.sms_settings_id_seq'::regclass);


--
-- Name: sms_verifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_verifications ALTER COLUMN id SET DEFAULT nextval('public.sms_verifications_id_seq'::regclass);


--
-- Name: smtp_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smtp_settings ALTER COLUMN id SET DEFAULT nextval('public.smtp_settings_id_seq'::regclass);


--
-- Name: super_admin_verifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admin_verifications ALTER COLUMN id SET DEFAULT nextval('public.super_admin_verifications_id_seq'::regclass);


--
-- Name: supported_languages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supported_languages ALTER COLUMN id SET DEFAULT nextval('public.supported_languages_id_seq'::regclass);


--
-- Name: user_widget_preferences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_widget_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_widget_preferences_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: widget_recommendations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widget_recommendations ALTER COLUMN id SET DEFAULT nextval('public.widget_recommendations_id_seq'::regclass);


--
-- Name: widget_usage_analytics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widget_usage_analytics ALTER COLUMN id SET DEFAULT nextval('public.widget_usage_analytics_id_seq'::regclass);


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
30	محمدرضا	غفاری	mr.ghafari@gmail.com	پتروشیمی شازند	water-treatment	zfzhh	2025-06-17 22:03:49.464644
31	Mohammadreza	Ghafari	mr.ghafari@gmail.com	پتروشیمی شازند	water-treatment	تست 4	2025-06-24 15:32:45.097752
\.


--
-- Data for Name: crm_customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.crm_customers (id, email, first_name, last_name, company, phone, alternate_phone, country, state, city, address, postal_code, industry, business_type, company_size, annual_revenue, customer_type, customer_status, customer_source, assigned_sales_rep, total_orders_count, total_spent, average_order_value, last_order_date, first_order_date, last_contact_date, next_follow_up_date, communication_preference, preferred_language, marketing_consent, product_interests, price_range, order_frequency, credit_limit, payment_terms, preferred_payment_method, credit_status, tags, internal_notes, public_notes, is_active, created_at, updated_at, created_by, password_hash, sms_enabled) FROM stdin;
4	sara.chemistry@example.com	سارا	شیمی	آزمایشگاه شیمی سارا	+98-21-55667788	\N	Iran	\N	Tehran	خیابان ولیعصر، پلاک 123	1234567890	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	2025-06-14 09:34:50.871	2025-06-14 09:34:50.871	2025-06-14 09:34:50.871	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 09:34:50.88302	2025-06-14 09:34:50.88302	auto_order	\N	t
12	roya@gmail.com	Roya	Roya	پتروشیمی شازند	09124955173	\N	Iran	\N	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	Customer registered through online shop	\N	t	2025-06-25 21:41:10.398492	2025-06-25 21:41:10.398492	customer_registration	\N	t
13	nader@gmail.com	Nader	Naderi	پتروشیمی شازند	09124955173	\N	Iran	\N	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	Customer registered through online shop	\N	t	2025-06-25 21:43:32.625804	2025-06-25 21:43:32.625804	customer_registration	\N	t
15	maryam.ahmadi@test.com	مریم	احمدی	شرکت شیمیایی البرز	09123456789	\N	Iran	\N	Tehran	خیابان کریمخان، پلاک 789	\N	Chemical Manufacturing	distributor	medium	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	fa	t	\N	\N	\N	\N	immediate	\N	good	\N	Customer registered through online shop	\N	t	2025-06-25 21:47:19.307302	2025-06-25 21:47:19.307302	customer_registration	$2b$10$EQRtdrY4Z/b6TJRU8T1.teVFHkHdfN6xmrB6VQwuUlhKsFCfunaiW	t
14	ahmad.rezaei@test.com	احمد	رضایی	شرکت پتروشیمی اصفهان	09121234567	\N	Iran	\N	Isfahan	خیابان چهارباغ، پلاک 456	\N	Petrochemical	manufacturer	large	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	fa	t	\N	\N	\N	\N	immediate	\N	good	\N	Customer registered through online shop	\N	t	2025-06-25 21:46:35.985573	2025-06-25 21:46:35.985573	customer_registration	$2b$10$EQRtdrY4Z/b6TJRU8T1.teVFHkHdfN6xmrB6VQwuUlhKsFCfunaiW	t
6	mr.ghafari@yahoo.com	محمدرضا	غفاری	پتروشیمی شازند	09124955173	\N	Iran	\N	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	2025-06-14 15:49:50.936	2025-06-14 15:49:50.936	2025-06-17 18:08:03.269	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 15:32:26.316294	2025-06-17 18:08:03.269	system	\N	t
1	ahmad.petrochemical@example.com	احمد	پتروشیمی	شرکت پتروشیمی ایران	+98-21-88776655	\N	Iran	\N	Tehran	\N	\N	\N	\N	\N	\N	b2b	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 09:34:31.929683	2025-06-14 09:34:31.929683	auto_order	\N	t
2	fateme.distribution@example.com	فاطمه	توزیع	شرکت توزیع مواد شیمیایی	+98-31-77889900	\N	Iran	\N	Isfahan	\N	\N	\N	\N	\N	\N	distributor	active	referral	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-14 09:34:31.929683	2025-06-14 09:34:31.929683	auto_order	\N	t
16	ali.test@example.com	علی	محمدی	شرکت شیمی پارس	09123456789	\N	Iran	\N	Tehran	خیابان ولیعصر، پلاک 100	\N	Chemical Manufacturing	manufacturer	large	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	fa	t	\N	\N	\N	\N	immediate	\N	good	\N	Customer registered through online shop	\N	t	2025-06-25 21:48:00.71047	2025-06-25 21:48:00.71047	customer_registration	$2b$10$RJcwQq..6EWWY1iZ6Okyw.aPKpo6QGvtsBa2YzD4bVolzRbwCbaEO	t
3	mohammad.retail@example.com	محمد	خرده‌فروش	فروشگاه مواد شیمیایی محمد	+98-51-33445566	\N	Iran	\N	Mashhad	\N	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	f	2025-06-14 09:34:31.929683	2025-06-17 21:49:49.956	auto_order	\N	t
7	reovo.ir@gmail.com	شکوفه	غفاری	\N	\N	\N	Iran	\N	تویسرکان	تویسرکان،خیابان حافظ شرقی جنب خدمات کامپیوتری گرین کد پستی 6581813674	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	2025-06-20 15:11:50.805	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-15 11:46:39.982535	2025-06-20 15:11:50.805	system	\N	t
5	mr.ghafari@gmail.com	محمدرضا	غفاری	پتروشیمی شازند	09124955173	\N	Iran	\N	TEHRAN	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran	1968913751	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	2025-06-15 11:29:08.239	2025-06-14 14:23:39.353	2025-06-15 11:29:08.504	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N		\N	t	2025-06-14 09:38:06.429023	2025-06-15 11:29:08.504	admin	\N	t
17	fateme.karimi@test.ir	فاطمه	کریمی	شرکت پتروشیمی فارس	09123456789	\N	Iran	\N	Shiraz	خیابان نمازی، پلاک 500	\N	Petrochemical	manufacturer	large	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	fa	t	\N	\N	\N	\N	immediate	\N	good	\N	Customer registered through online shop	\N	t	2025-06-25 21:48:29.483203	2025-06-25 21:48:29.483203	customer_registration	$2b$10$fvjLAfyNI79KkejvYQjZ1u1UkY0ynFxm7udiwY4Q9foqYxSLzrDPq	t
18	Daivid@gmail.com	Daivid	Dayvid	پتروشیمی شازند	09124955173	\N	Iran	\N	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	Customer registered through online shop	\N	t	2025-06-25 21:50:52.760184	2025-06-25 21:50:52.760184	customer_registration	$2b$10$8v0fhRdQs/uiKRLd4RcmiuovfZRQc7XHsZabboHxrezes7bVQQb6W	t
19	Naser@gmail.com	Naser	Yaran		02182122282	\N	Iran	\N	TEHRAN	No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN	\N	\N	\N	\N	\N	retail	active	legacy_migration	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	Migrated from legacy customer portal	\N	t	2025-06-25 22:05:19.132293	2025-06-25 22:05:19.132293	system	\N	t
8	oilstar@hotmail.com	ABAS	ABASI	پتروشیمی شازند	09124955173	\N	Iran	\N	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	2025-06-24 17:05:29.883	2025-06-24 17:05:29.883	2025-06-24 17:06:26.235	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	\N	\N	t	2025-06-24 17:04:49.892896	2025-06-24 17:06:26.235	system	\N	t
9	comprehensive@test.com	Comprehensive	Test	Full Test Co	+1234567890	+0987654321	USA	\N	New York	123 Complete Street	10001	Technology	manufacturer	medium	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	t	\N	\N	\N	\N	immediate	\N	good	\N	Complete test customer with all available fields	\N	t	2025-06-25 21:16:05.470586	2025-06-25 21:16:05.470586	system_test	\N	t
10	ali.mohammadi@example.com	علی	محمدی	شرکت شیمیایی پارس	09123456789	\N	Iran	\N	Tehran	خیابان ولیعصر، پلاک 123	\N	Chemical Manufacturing	manufacturer	medium	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	fa	t	\N	\N	\N	\N	immediate	\N	good	\N	Customer registered through online shop	\N	t	2025-06-25 21:27:14.529333	2025-06-25 21:27:14.529333	customer_registration	\N	t
11	Rostam@gmail.com	Rostam	Rostami	پتروشیمی شازند	09124955173	\N	Iran	\N	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	Customer registered through online shop	\N	t	2025-06-25 21:36:16.18457	2025-06-25 21:36:16.18457	customer_registration	\N	t
20	Yekta@gmail.com	Yekta	Mohammadi	Momtazchem	09123456789	\N	Iraq	\N	Erbil	NAGwer Road, Qaryataq Village, Erbil, Iraq	\N	\N	\N	\N	\N	retail	active	legacy_migration	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	Migrated from legacy customer portal	\N	t	2025-06-25 23:10:54.630156	2025-06-25 23:10:54.630156	system	\N	t
21	test@example.com	تست	مشتری		09123456789	\N	ایران	\N	تهران	تهران، خیابان آزادی	\N	\N	\N	\N	\N	retail	active	legacy_migration	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	Migrated from legacy customer portal	\N	t	2025-06-25 23:24:02.947126	2025-06-25 23:24:02.947126	system	\N	t
22	yasin@hotmail.com	Royae	Roya	پتروشیمی شازند	+982182122282	\N	Iran	\N	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	\N	\N	\N	\N	retail	active	website	\N	0	0.00	0.00	\N	\N	\N	\N	email	en	f	\N	\N	\N	\N	immediate	\N	good	\N	Customer registered through online shop	\N	t	2025-06-26 06:53:27.632217	2025-06-26 06:53:27.632217	customer_registration	$2b$10$hDiIVGIq5f0kxCA7oSOv1e5XGh3t8MrmxcgEmGU2cQBmBToVHgPlW	t
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
73	6	login	{"source":"website","loginDate":"2025-06-17T20:55:01.404Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-17 20:55:01.415108
74	6	login	{"source":"website","loginDate":"2025-06-17T21:02:13.924Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-17 21:02:13.940314
75	7	login	{"source":"website","loginDate":"2025-06-20T15:11:22.634Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-20 15:11:22.65118
76	7	order_placed	{"orderId":21,"totalAmount":135.8375,"itemCount":2,"source":"website","orderDate":"2025-06-20T15:11:50.658Z"}	سفارش جدید به مبلغ $135.8375 ثبت شد	\N	21	\N	2025-06-20 15:11:50.769578
77	7	login	{"source":"website","loginDate":"2025-06-21T06:41:55.511Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-21 06:41:55.525303
78	8	customer_created	{}	Customer ABAS ABASI was created	system	\N	\N	2025-06-24 17:04:49.930469
79	8	registration	{"source":"website","registrationDate":"2025-06-24T17:04:49.957Z"}	مشتری در فروشگاه آنلاین ثبت نام کرد	\N	\N	\N	2025-06-24 17:04:49.969483
80	8	customer_updated	{"updatedFields":["firstName","lastName","company","phone","country","city","address","postalCode","lastOrderDate","firstOrderDate","lastContactDate"]}	Customer information was updated	admin	\N	\N	2025-06-24 17:05:29.935666
81	8	order_placed	{"orderValue":152.46,"orderCount":1}	Order placed for $152.46	system	\N	\N	2025-06-24 17:05:29.961457
82	8	order_placed	{"orderId":22,"totalAmount":152.46,"itemCount":3,"source":"website","orderDate":"2025-06-24T17:05:30.188Z"}	سفارش جدید به مبلغ $152.46 ثبت شد	\N	22	\N	2025-06-24 17:05:30.201469
83	8	login	{"source":"website","loginDate":"2025-06-24T17:05:55.245Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-24 17:05:55.257523
84	8	order_placed	{"orderId":23,"totalAmount":135.8375,"itemCount":2,"source":"website","orderDate":"2025-06-24T17:06:26.118Z"}	سفارش جدید به مبلغ $135.8375 ثبت شد	\N	23	\N	2025-06-24 17:06:26.200765
85	8	login	{"source":"website","loginDate":"2025-06-24T19:33:37.061Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-24 19:33:37.075749
86	8	login	{"source":"website","loginDate":"2025-06-24T20:19:57.755Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-24 20:19:57.767932
87	7	customer_created	{"source":"website"}	Customer Ahmad Rezaei was created	customer_registration	\N	\N	2025-06-25 04:48:29.400178
88	7	registration	{"source":"website","registrationDate":"2025-06-25T04:48:29.863Z","hasPortalAccess":false}	Customer registered through online shop	system	\N	\N	2025-06-25 04:48:29.958196
89	7	login	{"source":"website","loginDate":"2025-06-25T04:48:30.343Z","userAgent":"curl/8.11.1"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-25 04:48:30.357007
90	9	customer_created	{"source":"website"}	Customer ABAS ABASI was created	customer_registration	\N	\N	2025-06-25 05:05:38.429653
91	9	registration	{"source":"website","registrationDate":"2025-06-25T05:05:38.828Z","hasPortalAccess":false}	Customer registered through online shop	system	\N	\N	2025-06-25 05:05:38.930864
92	5	login	{"source":"website","loginDate":"2025-06-25T05:08:02.679Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-25 05:08:02.69038
93	5	login	{"source":"website","loginDate":"2025-06-25T06:56:04.530Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-25 06:56:04.54449
94	5	login	{"source":"website","loginDate":"2025-06-25T07:02:01.539Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-25 07:02:01.553394
95	5	login	{"source":"website","loginDate":"2025-06-25T07:55:47.239Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-25 07:55:47.251831
96	5	order_placed	{"orderId":24,"totalAmount":135.8375,"itemCount":2,"source":"website","orderDate":"2025-06-25T07:56:22.217Z"}	سفارش جدید به مبلغ $135.8375 ثبت شد	\N	24	\N	2025-06-25 07:56:22.228215
97	5	login	{"source":"website","loginDate":"2025-06-25T15:30:14.010Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-25 15:30:14.022304
98	7	customer_updated	{"updatedFields":["id","email","firstName","lastName","company","phone","country","city","customerType","customerStatus","customerSource","lastOrderDate","createdAt","isActive","totalOrdersCount","totalSpent","averageOrderValue"]}	Customer information was updated	admin	\N	\N	2025-06-25 17:15:41.127969
99	7	customer_updated	{"updatedFields":["id","email","firstName","lastName","company","phone","country","city","customerType","customerStatus","customerSource","lastOrderDate","createdAt","isActive","totalOrdersCount","totalSpent","averageOrderValue"]}	Customer information was updated	admin	\N	\N	2025-06-25 17:15:50.996539
100	7	customer_updated	{"updatedFields":["id","email","firstName","lastName","company","phone","country","city","customerType","customerStatus","customerSource","lastOrderDate","createdAt","isActive","totalOrdersCount","totalSpent","averageOrderValue"]}	Customer information was updated	admin	\N	\N	2025-06-25 17:15:58.623786
101	7	customer_updated	{"updatedFields":["id","email","firstName","lastName","company","phone","country","city","customerType","customerStatus","customerSource","lastOrderDate","createdAt","isActive","totalOrdersCount","totalSpent","averageOrderValue"]}	Customer information was updated	admin	\N	\N	2025-06-25 17:59:09.686148
102	5	login	{"source":"website","loginDate":"2025-06-25T20:35:26.566Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}	مشتری وارد فروشگاه آنلاین شد	\N	\N	\N	2025-06-25 20:35:26.579507
103	11	customer_created	{"source":"website"}	Customer تست مشتری was created	customer_registration	\N	\N	2025-06-25 20:47:00.072824
104	11	registration	{"source":"website","registrationDate":"2025-06-25T20:47:00.489Z","hasPortalAccess":false}	Customer registered through online shop	system	\N	\N	2025-06-25 20:47:02.592836
105	13	customer_created	{"source":"website"}	Customer تست مشتری2 was created	customer_registration	\N	\N	2025-06-25 20:53:28.804269
106	13	registration	{"source":"website","registrationDate":"2025-06-25T20:53:29.242Z","hasPortalAccess":false}	Customer registered through online shop	system	\N	\N	2025-06-25 20:53:29.445711
107	15	customer_created	{"source":"website"}	Customer Ali Test was created	customer_registration	\N	\N	2025-06-25 20:55:42.391392
108	15	registration	{"source":"website","registrationDate":"2025-06-25T20:55:42.781Z","hasPortalAccess":false}	Customer registered through online shop	system	\N	\N	2025-06-25 20:55:42.877175
109	17	customer_created	{"source":"website"}	Customer محمد احمدی was created	customer_registration	\N	\N	2025-06-25 20:55:53.013468
110	17	registration	{"source":"website","registrationDate":"2025-06-25T20:55:53.381Z","hasPortalAccess":false}	Customer registered through online shop	system	\N	\N	2025-06-25 20:55:53.472565
111	19	customer_created	{"source":"website"}	Customer Yekta Mohammadi was created	customer_registration	\N	\N	2025-06-25 21:05:06.689957
112	19	registration	{"source":"website","registrationDate":"2025-06-25T21:05:07.150Z","hasPortalAccess":false}	Customer registered through online shop	system	\N	\N	2025-06-25 21:05:09.245474
113	17	login	{"source":"website","loginDate":"2025-06-25T21:08:48.908Z","userAgent":"curl/8.11.1","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 21:08:48.919154
114	19	login	{"source":"website","loginDate":"2025-06-25T21:12:01.218Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 21:12:01.230928
115	21	customer_created	{"source":"website"}	Customer Naser Yaran was created	customer_registration	\N	\N	2025-06-25 21:16:18.677588
116	21	registration	{"source":"website","registrationDate":"2025-06-25T21:16:19.162Z","hasPortalAccess":false}	Customer registered through online shop	system	\N	\N	2025-06-25 21:16:19.257459
117	10	customer_created	{"source":"website"}	Customer علی محمدی was created	customer_registration	\N	\N	2025-06-25 21:27:14.564351
118	10	registration	{"source":"website","registrationDate":"2025-06-25T21:27:15.016Z","hasPortalAccess":true,"portalCustomerId":23}	Customer registered through online shop	system	\N	\N	2025-06-25 21:27:15.028056
119	11	customer_created	{"source":"website"}	Customer Rostam Rostami was created	customer_registration	\N	\N	2025-06-25 21:36:16.219121
120	11	registration	{"source":"website","registrationDate":"2025-06-25T21:36:16.710Z","hasPortalAccess":true,"portalCustomerId":24}	Customer registered through online shop	system	\N	\N	2025-06-25 21:36:16.7214
121	12	customer_created	{"source":"website"}	Customer Roya Roya was created	customer_registration	\N	\N	2025-06-25 21:41:10.433379
122	12	registration	{"source":"website","registrationDate":"2025-06-25T21:41:10.909Z","hasPortalAccess":true,"portalCustomerId":25}	Customer registered through online shop	system	\N	\N	2025-06-25 21:41:10.922796
123	13	customer_created	{"source":"website"}	Customer Nader Naderi was created	customer_registration	\N	\N	2025-06-25 21:43:32.657051
124	13	registration	{"source":"website","registrationDate":"2025-06-25T21:43:33.131Z","hasPortalAccess":true,"portalCustomerId":26}	Customer registered through online shop	system	\N	\N	2025-06-25 21:43:33.142953
125	14	customer_created	{"source":"website"}	Customer احمد رضایی was created	customer_registration	\N	\N	2025-06-25 21:46:36.018557
126	14	registration	{"source":"website","registrationDate":"2025-06-25T21:46:36.399Z","hasPortalAccess":true,"portalCustomerId":27}	Customer registered through online shop	system	\N	\N	2025-06-25 21:46:36.4099
127	15	customer_created	{"source":"website"}	Customer مریم احمدی was created	customer_registration	\N	\N	2025-06-25 21:47:19.339734
128	15	registration	{"source":"website","registrationDate":"2025-06-25T21:47:19.793Z","hasPortalAccess":true,"portalCustomerId":28}	Customer registered through online shop	system	\N	\N	2025-06-25 21:47:19.805319
129	15	login	{"source":"website","loginDate":"2025-06-25T21:47:25.289Z","userAgent":"curl/8.11.1","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 21:47:25.305439
130	14	login	{"source":"website","loginDate":"2025-06-25T21:47:34.103Z","userAgent":"curl/8.11.1","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 21:47:34.115555
131	16	customer_created	{"source":"website"}	Customer علی محمدی was created	customer_registration	\N	\N	2025-06-25 21:48:00.743267
132	16	registration	{"source":"website","registrationDate":"2025-06-25T21:48:01.207Z","hasPortalAccess":true,"portalCustomerId":29}	Customer registered through online shop	system	\N	\N	2025-06-25 21:48:01.22163
133	17	customer_created	{"source":"website"}	Customer فاطمه کریمی was created	customer_registration	\N	\N	2025-06-25 21:48:29.515504
134	17	registration	{"source":"website","registrationDate":"2025-06-25T21:48:29.901Z","hasPortalAccess":true,"portalCustomerId":30}	Customer registered through online shop	system	\N	\N	2025-06-25 21:48:29.913231
176	19	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:31.532169
135	17	login	{"source":"website","loginDate":"2025-06-25T21:48:30.327Z","userAgent":"curl/8.11.1","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 21:48:30.339794
136	18	customer_created	{"source":"website"}	Customer Daivid Dayvid was created	customer_registration	\N	\N	2025-06-25 21:50:52.795357
137	18	registration	{"source":"website","registrationDate":"2025-06-25T21:50:53.182Z","hasPortalAccess":true,"portalCustomerId":31}	Customer registered through online shop	system	\N	\N	2025-06-25 21:50:53.194561
138	18	login	{"source":"website","loginDate":"2025-06-25T21:51:15.110Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 21:51:15.122163
139	18	order_placed	{"orderId":25,"totalAmount":100.12910000000001,"itemCount":1,"source":"website","orderDate":"2025-06-25T21:52:04.319Z"}	سفارش جدید به مبلغ $100.12910000000001 ثبت شد	\N	25	\N	2025-06-25 21:52:04.339419
140	19	customer_created	{"source":"legacy_migration"}	Customer Naser Yaran was created	system	\N	\N	2025-06-25 22:05:19.162034
141	19	login	{"source":"website","loginDate":"2025-06-25T22:05:19.201Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"portal_fallback"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 22:05:19.213635
142	7	login	{"source":"website","loginDate":"2025-06-25T22:08:49.817Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 22:08:49.828912
143	7	login	{"source":"website","loginDate":"2025-06-25T22:09:22.021Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 22:09:22.034141
144	7	login	{"source":"website","loginDate":"2025-06-25T22:11:26.327Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 22:11:26.339031
145	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:21.908872
146	24	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:21.931117
147	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:21.977948
148	19	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.000649
149	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.045924
150	25	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.06971
151	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.116455
152	29	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.139157
153	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.186903
154	31	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.21006
155	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.263899
156	30	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.290343
157	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.336353
158	21	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.359144
159	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.408772
160	17	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.432263
161	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.479244
162	28	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.502319
163	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.548262
164	7	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.57209
165	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.618674
166	9	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.641427
167	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.688132
168	26	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.710527
169	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.755912
170	27	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.778531
171	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:22.824034
172	23	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:22.846395
173	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:31.439082
174	24	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:31.462769
175	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:31.507473
177	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:31.577835
178	25	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:31.6009
179	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:31.646434
180	29	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:31.668733
181	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:31.71447
182	31	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:31.737129
183	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:31.783546
184	30	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:31.805857
185	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:31.851324
186	21	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:31.873768
187	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:31.919375
188	17	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:31.941859
189	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:31.989486
190	28	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:32.011942
191	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:32.056978
192	7	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:32.079709
193	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:32.127284
194	9	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:32.149876
195	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:32.195389
196	26	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:32.217711
197	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:32.264429
198	27	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:32.286955
199	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:32.333705
200	23	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:32.355968
201	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:47.682305
202	24	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:47.705092
203	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:47.756545
204	19	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:47.778916
205	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:47.824457
206	25	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:47.846843
207	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:47.893066
208	29	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:47.916133
209	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:47.967933
210	31	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:47.994778
211	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:48.041251
212	30	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:48.064125
213	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:48.110385
214	21	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:48.131949
215	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:48.180276
216	17	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:48.20488
217	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:48.250911
218	28	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:48.273158
219	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:48.32025
220	7	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:48.342818
221	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:48.388661
222	9	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:48.412257
223	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:48.458788
224	26	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:48.481401
225	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:48.528893
226	27	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:48.551359
227	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:14:48.598605
228	23	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:14:48.621204
229	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:00.725504
230	24	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:00.750601
231	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:00.799233
232	19	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:00.823225
233	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:00.873276
234	25	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:00.896674
235	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:00.94596
236	29	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:00.969949
237	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:01.019939
238	31	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:01.04653
239	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:01.099037
240	30	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:01.123193
241	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:01.173779
242	21	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:01.19884
243	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:01.256377
244	17	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:01.280178
245	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:01.331098
246	28	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:01.356346
247	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:01.403727
248	7	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:01.427682
249	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:01.476388
250	9	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:01.500607
251	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:01.549581
252	26	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:01.573444
253	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:01.622201
254	27	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:01.646587
255	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:01.696241
256	23	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:15:01.720519
257	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:10.745077
258	24	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:15:10.769707
259	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:15:17.474407
260	24	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:15:17.498936
261	8	login	{"source":"website","loginDate":"2025-06-25T22:18:39.392Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 22:18:39.405218
262	7	login	{"source":"website","loginDate":"2025-06-25T22:21:12.293Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 22:21:12.305527
263	7	login	{"source":"website","loginDate":"2025-06-25T22:25:15.169Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 22:25:15.181242
264	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:26:35.520463
265	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:26:35.543575
266	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:26:39.374628
267	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:26:39.400532
268	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:19.739489
269	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:28:19.762484
270	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:26.375772
271	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:28:26.399097
272	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:30.860627
273	30	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:30.884261
274	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:30.930435
275	21	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:30.952864
276	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:30.999318
277	26	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.020949
278	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:31.067325
279	27	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.089677
280	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:31.135681
281	23	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.159011
282	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:31.205406
283	17	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.228891
284	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:31.278741
285	28	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.302052
286	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:31.349443
287	24	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.372387
288	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:31.416926
289	7	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.439185
290	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:31.485671
291	9	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.507921
292	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:31.55348
293	19	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.574873
294	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:31.627868
295	25	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.652162
296	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:31.698228
297	29	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.720772
298	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:31.766869
299	31	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:31.789276
300	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:45.513069
301	30	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:45.536407
302	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:45.58288
303	21	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:45.605331
304	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:45.651753
305	26	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:45.674085
306	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:45.720079
307	27	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:45.742643
308	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:45.788632
309	23	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:45.811777
310	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:45.857379
311	17	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:45.878845
312	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:45.924276
313	28	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:45.946373
314	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:45.992065
315	24	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:46.014375
316	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:46.06137
317	7	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:46.083889
318	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:46.131669
319	9	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:46.154028
320	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:46.199901
321	19	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:46.222979
322	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:46.268903
323	25	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:46.291643
324	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:46.336728
325	29	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:46.357973
326	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:46.40274
327	31	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:46.427615
328	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:49.649514
329	30	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:49.671814
330	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:49.718717
331	21	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:49.74119
332	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:49.787677
333	26	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:49.810184
334	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:49.855362
335	27	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:49.877625
336	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:49.923374
337	23	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:49.945709
338	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:49.990712
339	17	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:50.020385
340	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:50.065
341	28	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:50.087151
342	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:50.132085
343	24	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:50.154303
344	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:50.199444
345	7	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:50.221616
346	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:50.268562
347	9	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:50.289837
348	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:50.337518
349	19	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:50.359104
350	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:50.405416
351	25	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:50.427702
352	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:50.473687
353	29	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:50.496217
354	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:50.54191
355	31	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:28:50.564238
356	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:28:59.779131
357	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:28:59.803719
358	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:29:01.953414
359	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:29:01.975568
360	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:30:59.961721
361	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:30:59.984606
362	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:31:04.571195
363	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:31:04.594138
364	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:28.540118
365	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:32:28.561006
366	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:31.187092
367	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:32:31.208775
368	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:35.970194
369	30	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:35.99182
370	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.036203
371	21	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.057972
372	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.102255
373	26	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.124137
374	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.17061
375	27	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.192332
376	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.236469
377	23	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.257799
378	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.301415
379	17	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.323334
380	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.36775
381	28	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.390276
382	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.436301
383	24	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.458026
384	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.502123
385	7	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.524082
386	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.570002
387	9	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.592031
388	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.635059
389	19	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.656707
390	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.700995
391	25	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.722634
392	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.766849
393	29	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.788407
394	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:36.833289
395	31	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:36.854648
396	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.067669
397	30	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.089569
398	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.13735
399	21	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.160271
400	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.204456
401	26	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.226281
402	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.271078
496	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:12.065342
403	27	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.292559
404	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.335968
405	23	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.3576
406	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.401966
407	17	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.423641
408	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.467785
409	28	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.497778
410	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.542245
411	24	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.564011
412	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.608087
413	7	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.630276
414	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.673092
415	9	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.694637
416	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.739603
417	19	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.761795
418	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.80653
419	25	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.828202
420	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.873057
421	29	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.89472
422	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:32:43.940009
423	31	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:32:43.962529
424	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:33:07.304856
425	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:33:07.328021
426	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:33:11.404753
427	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:33:11.427491
428	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:33:13.450691
429	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:33:13.474434
430	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:35:38.568771
431	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:35:38.591886
432	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:35:42.87689
433	30	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:35:42.899767
434	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:36:07.287835
435	21	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:36:07.31206
436	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:36:09.626321
437	26	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:36:09.649384
438	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:37:37.10704
439	17	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:37:37.130995
440	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:37:41.234703
441	17	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:37:41.256703
442	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.018525
443	30	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.043127
444	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.092183
445	21	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.116383
446	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.166734
447	26	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.191603
448	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.24282
449	27	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.269206
450	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.317886
451	23	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.342483
452	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.391774
453	17	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.418505
454	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.469263
455	28	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.493644
456	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.5432
457	24	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.568105
458	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.618611
459	7	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.644647
460	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.696324
461	9	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.720342
462	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.775321
463	19	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.800416
464	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.851229
465	25	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.875821
466	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:08.927603
467	29	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:08.951691
468	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:09.000285
469	31	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:09.024208
470	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.090454
471	30	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.114722
472	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.165185
473	21	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.190317
474	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.237804
475	26	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.264142
476	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.316338
477	27	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.340385
478	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.390857
479	23	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.415237
480	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.465499
481	17	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.492744
482	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.542945
483	28	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.567047
484	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.616168
485	24	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.640296
486	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.688433
487	7	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.712611
488	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.762876
489	9	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.786954
490	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.83663
491	19	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.860746
492	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.909369
493	25	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:11.933499
494	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:11.989064
495	29	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:12.014
497	31	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:12.090572
498	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:15.369803
499	30	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:15.394902
500	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:15.442623
501	21	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:15.471245
502	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:15.522388
503	26	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:15.546319
504	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:15.596013
505	27	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:15.62081
506	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:15.671903
507	23	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:15.695791
508	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:15.745111
509	17	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:15.7691
510	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:15.818032
511	28	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:15.842021
512	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:15.891006
513	24	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:15.916171
514	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:15.964757
515	7	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:15.98924
516	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:16.041101
517	9	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:16.065026
518	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:16.113927
519	19	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:16.13783
520	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:16.186622
521	25	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:16.214857
522	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:16.265085
523	29	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:16.289526
524	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:38:16.340547
525	31	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:38:16.364319
526	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:43.403731
527	30	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:43.427193
528	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:43.473257
529	21	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:43.495971
530	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:43.542067
531	26	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:43.564891
532	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:43.611779
533	27	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:43.634898
534	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:43.683047
535	23	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:43.706472
536	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:43.753846
537	17	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:43.776364
538	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:43.823435
539	28	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:43.846839
540	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:43.893151
541	24	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:43.915612
542	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:43.961885
543	7	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:43.983522
544	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:44.030869
545	9	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:44.053431
546	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:44.099271
547	19	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:44.121531
548	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:44.166452
549	25	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:44.188904
550	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:44.235048
551	29	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:44.257862
552	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:44.304022
553	31	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:44.327433
554	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:45.700736
555	30	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:45.723335
556	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:45.770511
557	21	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:45.793235
558	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:45.838638
559	26	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:45.861559
560	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:45.907949
561	27	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:45.93068
562	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:45.97777
563	23	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:45.999699
564	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:46.047177
565	17	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:46.069945
566	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:46.11673
567	28	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:46.139228
568	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:46.18547
569	24	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:46.208094
570	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:46.254372
571	7	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:46.276827
572	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:46.322897
573	9	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:46.511897
574	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:46.559925
575	19	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:46.582825
576	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:46.628981
577	25	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:46.650566
578	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:46.69963
579	29	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:46.722115
580	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:46.768074
581	31	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:46.790659
582	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.204389
583	30	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.226415
584	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.273233
585	21	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.295891
586	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.343595
587	26	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.366409
588	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.413256
589	27	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.436599
590	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.48516
591	23	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.51291
592	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.559202
593	17	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.583029
594	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.630149
595	28	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.65286
596	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.700823
597	24	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.723667
598	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.77008
599	7	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.791488
600	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.837906
601	9	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.860629
602	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.906686
603	19	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.928629
604	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:39:59.975495
605	25	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:39:59.999368
606	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:40:00.047232
607	29	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:40:00.070051
608	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:40:00.120562
609	31	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:40:00.142539
610	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:41:02.725909
611	19	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:41:02.748695
612	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:41:11.622909
613	19	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:41:11.649111
614	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:41:40.991207
615	7	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:41:41.014899
616	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:45:53.557949
617	7	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:45:53.585534
618	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:11.551081
619	30	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:11.572972
620	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:11.621382
621	21	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:11.661407
622	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:11.706207
623	26	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:11.730825
624	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:11.777301
625	27	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:11.799587
626	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:11.844964
627	23	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:11.868701
628	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:11.913912
629	17	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:11.93665
630	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:11.982541
631	28	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:12.005531
632	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:12.051499
633	24	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:12.074238
634	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:12.123935
635	7	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:12.148311
636	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:12.196268
637	9	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:12.218046
638	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:12.264392
639	19	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:12.286226
640	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:12.330931
641	25	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:12.352827
642	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:12.400503
643	29	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:12.4227
644	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:12.475095
645	31	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:12.49602
646	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:20.850925
647	30	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:20.872671
648	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:20.919043
649	21	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:20.943137
650	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:20.989653
651	26	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.011517
652	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:21.056872
653	27	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.078564
654	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:21.123649
655	23	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.145368
656	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:21.18936
657	17	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.211721
658	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:21.255787
659	28	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.277967
660	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:21.322805
661	24	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.345145
662	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:21.390517
663	7	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.412604
664	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:21.460654
665	9	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.482452
666	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:21.526808
667	19	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.548809
668	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:21.598673
669	25	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.634671
670	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:21.678857
671	29	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.702774
672	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:46:21.746751
673	31	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:46:21.768939
674	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:47:01.403761
675	19	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:47:01.428433
676	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:47:21.85289
677	19	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:47:21.876245
678	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:51:21.98443
679	19	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:51:22.018176
680	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:09.436379
681	19	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:52:09.4612
682	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.182395
683	30	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.204741
684	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.248025
685	21	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.269165
686	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.313398
687	26	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.336116
688	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.384013
689	27	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.406968
690	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.451928
691	23	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.473107
692	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.51704
693	17	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.539704
694	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.583851
695	28	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.610995
696	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.65469
697	24	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.676011
698	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.719298
699	7	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.740366
700	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.785064
701	9	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.806421
702	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.849921
703	19	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.871366
704	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.915429
705	25	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:40.938404
706	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:40.982076
707	29	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:41.00427
708	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:52:41.050364
709	31	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 22:52:41.074455
710	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:53:13.533878
711	19	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:53:13.555766
712	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 22:58:45.97318
713	19	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 22:58:46.005314
714	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:00:16.930225
715	19	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 23:00:16.953703
716	9	customer_updated	{"updatedFields":["id","email","firstName","lastName","company","phone","country","city","customerType","customerStatus","customerSource","lastOrderDate","createdAt","isActive","totalOrdersCount","totalSpent","averageOrderValue"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:01:51.25564
717	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:02:10.073827
718	9	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 23:02:10.099136
719	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:03:17.453268
720	9	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 23:03:17.476536
721	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:03:47.667261
722	9	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 23:03:47.691185
723	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:05:25.364036
724	9	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 23:05:25.387942
725	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:05:28.402914
726	7	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 23:05:28.428558
727	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:06:35.668701
728	7	sms_setting_changed	{"smsEnabled":false,"changedBy":"admin"}	SMS غیرفعال شد توسط ادمین	1	\N	\N	2025-06-25 23:06:35.693872
729	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:06:36.780857
730	9	sms_setting_changed	{"smsEnabled":false,"changedBy":"admin"}	SMS غیرفعال شد توسط ادمین	1	\N	\N	2025-06-25 23:06:36.806154
731	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:07:49.290273
732	9	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 23:07:49.313679
733	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:18.782068
734	17	sms_setting_changed	{"smsEnabled":true,"changedBy":"admin"}	SMS فعال شد توسط ادمین	1	\N	\N	2025-06-25 23:09:18.805911
735	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:31.272188
736	30	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:31.295184
737	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:31.343281
738	21	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:31.365755
739	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:31.411572
740	26	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:31.434108
741	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:31.479956
742	27	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:31.503551
743	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:31.548595
744	23	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:31.572237
745	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:31.619277
746	17	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:31.641338
747	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:31.686356
748	28	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:31.709942
749	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:31.75608
750	24	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:31.778041
751	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:31.823767
752	7	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:31.845768
753	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:31.891382
754	9	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:31.913334
755	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:31.968094
756	19	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:31.990724
757	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:32.036584
758	25	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:32.058638
759	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:32.104995
760	29	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:32.128463
761	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:32.176682
762	31	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:32.199086
763	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:36.736821
764	30	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:36.759839
765	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:36.808266
766	21	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:36.831541
767	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:36.879775
768	26	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:36.903154
769	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:36.951729
770	27	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:36.97364
771	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:37.022055
772	23	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:37.044988
773	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:37.093559
774	17	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:37.116651
775	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:37.173082
776	28	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:37.195702
777	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:37.246373
778	24	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:37.269482
779	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:37.320216
780	7	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:37.34316
781	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:37.390913
782	9	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:37.412427
783	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:37.467891
784	19	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:37.489678
785	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:37.536245
786	25	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:37.560339
787	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:37.605545
788	29	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:37.628547
789	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:09:37.696183
790	31	sms_bulk_setting_changed	{"smsEnabled":true,"action":"bulk","changedBy":"admin"}	SMS فعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:09:37.7192
791	30	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.107537
792	30	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.131117
793	21	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.178833
794	21	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.200753
795	26	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.247988
796	26	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.271787
797	27	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.31926
798	27	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.34227
799	23	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.395841
800	23	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.41808
801	17	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.476683
802	17	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.498814
803	28	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.550538
804	28	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.572804
805	24	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.61873
806	24	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.64116
807	7	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.687383
808	7	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.710197
809	9	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.760379
810	9	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.784043
811	19	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.829454
812	19	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.852266
813	25	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.903919
814	25	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:10.931214
815	29	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:10.978714
816	29	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:11.001311
817	31	customer_updated	{"updatedFields":["smsEnabled"]}	Customer information was updated	admin	\N	\N	2025-06-25 23:10:11.047748
818	31	sms_bulk_setting_changed	{"smsEnabled":false,"action":"bulk","changedBy":"admin"}	SMS غیرفعال شد برای همه مشتریان توسط ادمین	1	\N	\N	2025-06-25 23:10:11.06977
819	20	customer_created	{"source":"legacy_migration"}	Customer Yekta Mohammadi was created	system	\N	\N	2025-06-25 23:10:54.661545
820	20	login	{"source":"website","loginDate":"2025-06-25T23:10:54.699Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"portal_fallback"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 23:10:54.712752
821	8	login	{"source":"website","loginDate":"2025-06-25T23:17:55.024Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 23:17:55.036461
822	7	login	{"source":"website","loginDate":"2025-06-25T23:19:16.337Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 23:19:16.348462
823	7	login	{"source":"website","loginDate":"2025-06-25T23:23:49.650Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 23:23:49.664192
824	21	customer_created	{"source":"legacy_migration"}	Customer تست مشتری was created	system	\N	\N	2025-06-25 23:24:02.976316
825	21	login	{"source":"website","loginDate":"2025-06-25T23:24:03.009Z","userAgent":"curl/8.11.1","loginMethod":"portal_fallback"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 23:24:03.021506
826	8	login	{"source":"website","loginDate":"2025-06-25T23:24:51.697Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 23:24:51.710216
827	7	login	{"source":"website","loginDate":"2025-06-25T23:26:30.374Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 23:26:30.386696
828	7	login	{"source":"website","loginDate":"2025-06-25T23:30:43.428Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 23:30:43.44188
829	7	login	{"source":"website","loginDate":"2025-06-25T23:33:43.450Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 23:33:43.461701
830	7	login	{"source":"website","loginDate":"2025-06-25T23:41:35.001Z","userAgent":"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-25 23:41:35.016323
831	8	login	{"source":"website","loginDate":"2025-06-26T06:44:30.665Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-26 06:44:30.676964
832	8	login	{"source":"website","loginDate":"2025-06-26T06:46:15.424Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-26 06:46:15.436798
833	8	login	{"source":"website","loginDate":"2025-06-26T06:51:18.316Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-26 06:51:18.329646
834	22	customer_created	{"source":"website"}	Customer Royae Roya was created	customer_registration	\N	\N	2025-06-26 06:53:27.689414
835	22	registration	{"source":"website","registrationDate":"2025-06-26T06:53:28.076Z","hasPortalAccess":true,"portalCustomerId":32}	Customer registered through online shop	system	\N	\N	2025-06-26 06:53:28.087324
836	22	login	{"source":"website","loginDate":"2025-06-26T06:54:04.764Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-26 06:54:04.776097
837	8	login	{"source":"website","loginDate":"2025-06-26T06:54:56.573Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-26 06:54:56.585361
838	22	login	{"source":"website","loginDate":"2025-06-26T06:55:21.748Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-26 06:55:21.759626
839	7	login	{"source":"website","loginDate":"2025-06-26T07:28:48.993Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-26 07:28:49.006686
840	8	login	{"source":"website","loginDate":"2025-06-26T15:04:10.589Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-26 15:04:10.60118
841	8	login	{"source":"website","loginDate":"2025-06-26T15:13:32.683Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-26 15:13:32.657442
842	7	login	{"source":"website","loginDate":"2025-06-26T15:34:12.150Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","loginMethod":"crm_direct"}	مشتری وارد فروشگاه آنلاین شد	customer	\N	\N	2025-06-26 15:34:12.164223
\.


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_addresses (id, customer_id, title, first_name, last_name, company, phone, country, state, city, address, postal_code, is_default, created_at, updated_at, recipient_name, latitude, longitude, location_accuracy) FROM stdin;
1	23	منزل	علی	محمدی	شرکت شیمیایی پارس	09123456789	ایران	تهران	تهران	خیابان ولیعصر، پلاک 123	1234567890	t	2025-06-25 22:17:06.663107	2025-06-25 22:17:06.663107	علی محمدی	\N	\N	\N
2	23	محل کار	علی	محمدی	شرکت شیمیایی پارس	02122334455	ایران	تهران	تهران	خیابان کریمخان زند، برج میلاد، طبقه 15	1387654321	f	2025-06-25 22:17:06.663107	2025-06-25 22:17:06.663107	علی محمدی	\N	\N	\N
3	24	منزل	سارا	احمدی	شرکت نفت و گاز البرز	09381234567	ایران	البرز	کرج	خیابان طالقانی، کوچه نرگس، پلاک 18 واحد 10	3149876543	t	2025-06-25 22:17:06.663107	2025-06-25 22:17:06.663107	سارا احمدی	\N	\N	\N
4	4	منزل	سارا	شیمی	ایران	09124955173	ایران	تهران	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	1478815493	t	2025-06-25 23:32:09.734872	2025-06-25 23:42:51.755	عباس	35.76614570	51.28616850	20.10
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
8	\N	INQ-1749892840288-SANNHB	product_info	Inquiry about Water Treatment Chemical A1	I am interested in learning more about Water Treatment Chemical A1. Please provide me with detailed information including pricing, specifications, and availability.	normal	in_progress	water-treatment	[2]	\N	mr.ghafari@gmail.com	+989124955173	پتروشیمی شازند	\N	\N	\N	\N	\N	\N	2025-06-14 09:20:40.371319	2025-06-17 22:43:36.397
\.


--
-- Data for Name: customer_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_orders (id, order_number, customer_id, total_amount, status, priority, currency, payment_status, payment_method, shipping_address, billing_address, notes, guest_email, guest_name, tracking_number, estimated_delivery, actual_delivery, internal_notes, created_at, updated_at, shipped_at, carrier, delivered_at) FROM stdin;
11	ORD-1749986464755-2FIAUT79Z	\N	104.50	pending	normal	USD	pending	\N	{"city": "TEHRAN", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 11:21:04.85064	2025-06-15 11:21:04.85064	\N	\N	\N
12	ORD-1749986948311-S9LG407T4	\N	135.84	pending	normal	USD	pending	\N	{"city": "TEHRAN", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 11:29:08.393724	2025-06-15 11:29:08.393724	\N	\N	\N
13	ORD-1749987537134-JSCY3Y1X3	3	94.00	pending	normal	USD	pending	\N	{"city": "TEHRAN", "address": "No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 11:38:57.214492	2025-06-15 11:38:57.214492	\N	\N	\N
14	ORD-1749987771414-VLH07PMWP	3	81.34	confirmed	normal	USD	pending	\N	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 11:42:51.500226	2025-06-15 11:48:01.413	\N	\N	\N
15	ORD-1749988163147-UG08DUQGO	4	135.84	pending	normal	USD	pending	\N	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 11:49:23.23428	2025-06-15 11:49:23.23428	\N	\N	\N
16	ORD-1749989125268-RB8UBCDA8	3	81.34	pending	normal	USD	pending	cash_on_delivery	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 12:05:25.351776	2025-06-15 12:05:25.351776	\N	Express Shipping (2-3 days)	\N
17	ORD-1749992761940-ZO49B851N	3	97.96	delivered	normal	USD	pending	cash_on_delivery	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-15 13:06:02.019266	2025-06-15 13:09:07.196	\N	Express Shipping (2-3 days)	\N
24	ORD-1750838182004-O5N5TP084	5	135.84	confirmed	normal	USD	pending	company_credit	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-25 07:56:22.089867	2025-06-25 08:00:16.643	\N	Express Shipping (2-3 days)	\N
19	ORD-1750082248311-HNXACIC9Q	3	482.19	shipped	normal	USD	pending	cash_on_delivery	{"city": "تویسرکان", "address": "خیابان حافظ شرقی جنب خدمات کامپیوتری گرین روبروی خشکشویی یاس, , تویسرکان, تهران, 6581813674, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-16 13:57:28.393648	2025-06-16 19:25:07.489	\N	Express Shipping (2-3 days)	\N
20	ORD-1750183682919-TADGY0YT9	3	99.87	shipped	normal	USD	pending	cash_on_delivery	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-17 18:08:03.0146	2025-06-17 18:11:50.963	\N	Express Shipping (2-3 days)	\N
18	ORD-1750048431351-POADZKXCT	3	104.50	shipped	normal	USD	pending	cash_on_delivery	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-16 04:33:51.444688	2025-06-18 11:54:15.524	\N	Overnight Shipping	\N
21	ORD-1750432310497-CDGFMXWMN	4	135.84	confirmed	normal	USD	pending	cash_on_delivery	{"city": "TEHRAN", "address": "No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN, , TEHRAN, تهران, 1968913751, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-20 15:11:50.581934	2025-06-20 15:12:50.244	\N	Express Shipping (2-3 days)	\N
22	ORD-1750784729974-VJQT80512	\N	152.46	pending	normal	USD	pending	cash_on_delivery	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-24 17:05:30.077894	2025-06-24 17:05:30.077894	\N	Express Shipping (2-3 days)	\N
23	ORD-1750784785947-GK8TDA2O0	5	135.84	pending	normal	USD	pending	cash_on_delivery	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-24 17:06:26.050446	2025-06-24 17:06:26.050446	\N	Express Shipping (2-3 days)	\N
25	ORD-1750888324099-PNEQIXTRW	18	100.13	confirmed	normal	USD	pending	cash_on_delivery	{"city": "تهران", "address": "شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10, , تهران, تهران, 1478815493, Iran", "country": "Iran"}	\N		\N	\N	\N	\N	\N	\N	2025-06-25 21:52:04.229196	2025-06-26 17:08:56.015	\N	Express Shipping (2-3 days)	\N
\.


--
-- Data for Name: customer_segments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_segments (id, name, description, criteria, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_sms_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_sms_settings (id, customer_id, sms_auth_enabled, enabled_by, enabled_at, disabled_by, disabled_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, email, first_name, last_name, phone, company, tax_id, is_verified, is_active, total_orders, total_spent, last_order_date, notes, created_at, updated_at, password_hash, country, city, address, postal_code, email_verified, verification_token, reset_password_token, reset_password_expires, alternate_phone, state, date_of_birth, industry, business_type, company_size, customer_type, customer_status, customer_source, total_orders_count, average_order_value, first_order_date, communication_preference, preferred_language, marketing_consent, product_interests, credit_limit, payment_terms, preferred_payment_method, assigned_sales_rep, tags, internal_notes, lead_score, lead_status, segment_id, referral_source, acquisition_cost, lifetime_value, last_contact_date, next_follow_up_date, public_notes) FROM stdin;
5	oilstar@hotmail.com	Oil	Star	\N	\N	\N	f	f	1	135.84	2025-06-24 17:06:26.050446	\N	2025-06-24 17:04:49.847893	2025-06-25 04:09:27.7	$2b$12$uszOtAurP.8zjuya1MzOGO3ho8kjRK73KuD/iwfHzYq4kfpLfUJ6u	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
1	mr.ghafari@gmail.com	محمدرضا	غفاری	09124955173	پتروشیمی شازند	\N	f	f	0	0.00	\N	\N	2025-06-13 01:59:12.524813	2025-06-25 04:09:31.111	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
2	sara.chemistry@example.com	سارا	شیمی	+98-21-55667788	آزمایشگاه شیمی سارا	\N	f	f	0	0.00	\N	\N	2025-06-14 09:34:50.475621	2025-06-25 04:09:36.074	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
21	Naser@gmail.com	Naser	Yaran	02182122282	\N	\N	f	t	0	0.00	\N	\N	2025-06-25 21:16:18.643811	2025-06-25 23:10:10.143	$2b$10$SxHETBQO4ELd9T7uDzork.hbFors4PS/5DtChYc17fnGFIR3pkvqK	Iran	TEHRAN	No. 68 TABAN St., Vali-e-asr Ave., TEHRAN- IRAN	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	Customer registered through online shop	0	new	\N	\N	\N	\N	\N	\N	\N
28	maryam.ahmadi@test.com	مریم	احمدی	09123456789	شرکت شیمیایی البرز	\N	f	t	0	0.00	\N	\N	2025-06-25 21:47:19.780094	2025-06-25 23:10:10.516	$2b$12$qBgYgsM1w6vE040UpDQZve9z/QpYeYnqX/L1JjCbB8X5GI5urgb9O	Iran	Tehran	خیابان کریمخان، پلاک 789	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
7	ahmad1@test.com	Ahmad	Rezaei	09123456789	شرکت نمونه	\N	f	t	0	0.00	\N	\N	2025-06-25 04:48:29.37	2025-06-25 23:10:10.652	$2b$10$hhYDNwZoE1Jj77xDAX2Ot.6vSSc9ZtkojA8xYnzhQZokK81vc0JZu	Iran	Tehran	خیابان ولیعصر، پلاک 123	1234567890	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	wholesale	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	Customer registered through online shop	0	new	\N	\N	\N	\N	\N	\N	\N
25	roya@gmail.com	Roya	Roya	09124955173	پتروشیمی شازند	\N	f	t	0	0.00	\N	\N	2025-06-25 21:41:10.897162	2025-06-25 23:10:10.864	$2b$12$SuEm0NmXt4eRRXyPjslpLuDHz7s1yWP1kum/UjHpZ/FX8h4tUXDRC	Iran	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
15	ali@test.com	Ali	Test	09123456789		\N	f	f	0	0.00	\N	\N	2025-06-25 20:55:42.357883	2025-06-25 21:47:19.841	$2b$10$4ZHW/6kJ1SNnNgQliz7f1e6kQEdGMv2crzLBZhakP9h32NkpZYZPu	Iran	Tehran	Tehran Street	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	Customer registered through online shop	0	new	\N	\N	\N	\N	\N	\N	\N
23	ali.mohammadi@example.com	علی	محمدی	09123456789	شرکت شیمیایی پارس	\N	f	t	0	0.00	\N	\N	2025-06-25 21:27:14.993739	2025-06-25 23:10:10.355	$2b$12$b.sG91DNdoxs.ZjG9AetUeJRPed4/ffFGh6w324QX.RDHxjMxqrZG	Iran	Tehran	خیابان ولیعصر، پلاک 123	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
3	mr.ghafari@yahoo.com	محمدرضا	غفاری	09124955173	پتروشیمی شازند	\N	f	f	7	1041.20	2025-06-17 18:08:03.0146	\N	2025-06-14 15:32:26.286364	2025-06-25 04:09:19.602	$2b$12$iIbstyROWr5LtBF63Zq8deNHJvnDATqKLDpipp9sTapkbBmbcUy5i	Iran	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
4	reovo.ir@gmail.com	شکوفه	غفاری	\N	\N	\N	f	f	2	271.68	2025-06-20 15:11:50.581934	\N	2025-06-15 11:46:39.955585	2025-06-25 04:09:24.186	$2b$12$2R7afSKwXY28ZLHgMNpGVuCfQCZMGpuTYDkC0MI23KjNc5.L0f6Pe	Iran	تویسرکان	تویسرکان،خیابان حافظ شرقی جنب خدمات کامپیوتری گرین کد پستی 6581813674	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
31	Daivid@gmail.com	Daivid	Dayvid	09124955173	پتروشیمی شازند	\N	f	t	0	0.00	\N	\N	2025-06-25 21:50:53.167823	2025-06-25 23:10:11.013	$2b$12$flmRTH91cRt1SRP4fIqZiexjXVyZwcOEdFRI6d/ztvuyKhqszQH66	Iran	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
11	test@example.com	تست	مشتری	09123456789		\N	f	f	0	0.00	\N	\N	2025-06-25 20:47:00.038763	2025-06-25 21:36:16.777	$2b$10$qGGBQ1adbs98gdteWgFDJOjsgZ7uymzv2D.KrqPbnQbzSWzq54vl6	ایران	تهران	تهران، خیابان آزادی	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	Customer registered through online shop	0	new	\N	\N	\N	\N	\N	\N	\N
13	test2@example.com	تست	مشتری2	09123456789		\N	f	f	0	0.00	\N	\N	2025-06-25 20:53:28.772748	2025-06-25 21:43:33.178	$2b$10$8/RS1e7I.WT70cyFt5oTmeAOtp5yskbP7JSKqb/j5RozRaHIuKsRK	ایران	تهران	تهران، خیابان ولیعصر	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	Customer registered through online shop	0	new	\N	\N	\N	\N	\N	\N	\N
30	fateme.karimi@test.ir	فاطمه	کریمی	09123456789	شرکت پتروشیمی فارس	\N	f	t	0	0.00	\N	\N	2025-06-25 21:48:29.888911	2025-06-25 23:10:10.073	$2b$12$ISv/F6I0arHS017sKSd9l..Kftrous.OyLJ7qTDH/B2mOU3YV8QUe	Iran	Shiraz	خیابان نمازی، پلاک 500	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
27	ahmad.rezaei@test.com	احمد	رضایی	09121234567	شرکت پتروشیمی اصفهان	\N	f	t	0	0.00	\N	\N	2025-06-25 21:46:36.386859	2025-06-25 23:10:10.284	$2b$12$3Xr8nLp42SF1i0iSIxifQOxbxoRwHxfSvjFZ/o/BFn/uXginxyoNu	Iran	Isfahan	خیابان چهارباغ، پلاک 456	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
24	Rostam@gmail.com	Rostam	Rostami	09124955173	پتروشیمی شازند	\N	f	t	0	0.00	\N	\N	2025-06-25 21:36:16.682789	2025-06-25 23:10:10.584	$2b$12$JMNIugX7OjHjAJryNWSDGuMIG3p78lXEkHUBhw4WtCsIF38cJ2tQ2	Iran	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
26	nader@gmail.com	Nader	Naderi	09124955173	پتروشیمی شازند	\N	f	t	0	0.00	\N	\N	2025-06-25 21:43:33.118216	2025-06-25 23:10:10.212	$2b$12$jql/YvuNiXHJ6Cx2CvtP/uGp5Ws1M9PvB4OW5zgZwcu.Gl.F3e9Hy	Iran	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
19	Yekta@gmail.com	Yekta	Mohammadi	09123456789	Momtazchem	\N	f	t	0	0.00	\N	\N	2025-06-25 21:05:06.653621	2025-06-25 23:10:10.795	$2b$10$eRE8mbuun5ycwsGr4jk0NewcLAH0qSRDVn40.xnKdS9/A8M1zo9fu	Iraq	Erbil	NAGwer Road, Qaryataq Village, Erbil, Iraq	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	Customer registered through online shop	0	new	\N	\N	\N	\N	\N	\N	\N
17	mohammad@example.com	محمد	احمدی	09123456789		\N	f	t	0	0.00	\N	\N	2025-06-25 20:55:52.983215	2025-06-25 23:10:10.438	$2b$10$2Hxl5/tGlBAgWRK5s/wpYOoy2CmEXEhhajc9gQ/FOw.LCwLBiN4Ei	ایران	تهران	تهران، خیابان آزادی ۱۲۳	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	Customer registered through online shop	0	new	\N	\N	\N	\N	\N	\N	\N
9	info@momtazchem.com	ABAS	ABASI	09124955173	ااااا	\N	f	t	0	0.00	\N	\N	2025-06-25 05:05:38.398	2025-06-25 23:10:10.725	$2b$10$38PaD9taWMp70YOOVZigte1y8GSjg/uG9erg8EugShynwgxuM4GL6	Iran	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	Customer registered through online shop	0	new	\N	\N	\N	\N	\N	\N	\N
29	ali.test@example.com	علی	محمدی	09123456789	شرکت شیمی پارس	\N	f	t	0	0.00	\N	\N	2025-06-25 21:48:01.194237	2025-06-25 23:10:10.942	$2b$12$6Ns5AFe.6pHz9NKsl.l2FepSDX2ijsrm3vWO97dlPL94D7aSOhHNa	Iran	Tehran	خیابان ولیعصر، پلاک 100	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
32	yasin@hotmail.com	Royae	Roya	+982182122282	پتروشیمی شازند	\N	f	t	0	0.00	\N	\N	2025-06-26 06:53:28.06315	2025-06-26 06:53:28.06315	$2b$12$VhfS2uPHHExa.u4Z8UO2COHid0O7zZpx2OAMpE29iAkuh/6VK2LUm	Iran	تهران	شهران، فلکه دوم، خ یکم، خ شیخ الاسلامی، کوچه اول، پ 18 واحد 10	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	retail	active	website	0	0.00	\N	email	en	f	\N	\N	immediate	\N	\N	\N	\N	0	new	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: dashboard_widgets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dashboard_widgets (id, name, display_name, description, category, icon_name, is_active, priority, min_user_level, created_at, updated_at) FROM stdin;
1	customer_overview	Customer Overview	Overview of customer metrics and statistics	customers	Users	t	1	admin	2025-06-25 22:44:48.782392	2025-06-25 22:44:48.782392
2	sales_analytics	Sales Analytics	Real-time sales performance and trends	analytics	BarChart3	t	2	admin	2025-06-25 22:44:48.782392	2025-06-25 22:44:48.782392
3	inventory_status	Inventory Status	Current inventory levels and alerts	inventory	Grid3X3	t	3	admin	2025-06-25 22:44:48.782392	2025-06-25 22:44:48.782392
4	recent_orders	Recent Orders	Latest customer orders and status	sales	TrendingUp	t	4	admin	2025-06-25 22:44:48.782392	2025-06-25 22:44:48.782392
5	system_health	System Health	Application performance monitoring	system	Activity	t	5	admin	2025-06-25 22:44:48.782392	2025-06-25 22:44:48.782392
6	notifications	Notifications	Important alerts and messages	system	Zap	t	6	admin	2025-06-25 22:44:48.782392	2025-06-25 22:44:48.782392
7	quick_actions	Quick Actions	Frequently used administrative actions	system	Target	t	7	admin	2025-06-25 22:44:48.782392	2025-06-25 22:44:48.782392
8	revenue_chart	Revenue Chart	Monthly revenue trends and forecasts	analytics	BarChart3	t	8	admin	2025-06-25 22:44:48.782392	2025-06-25 22:44:48.782392
\.


--
-- Data for Name: delivery_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_codes (id, order_management_id, code, is_used, used_at, verified_by, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: department_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.department_assignments (id, admin_user_id, department, is_active, assigned_at, assigned_by) FROM stdin;
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
30	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	بازیابی رمز عبور - Momtaz Chemical	sent	\N	2025-06-17 21:19:31.285	2025-06-17 21:19:31.299374
31	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	بازیابی رمز عبور - Momtaz Chemical	sent	\N	2025-06-17 21:21:20.082	2025-06-17 21:21:20.094411
32	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	بازیابی رمز عبور - Momtaz Chemical	sent	\N	2025-06-17 21:22:57.595	2025-06-17 21:22:57.606667
33	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	بازیابی رمز عبور - Momtaz Chemical	sent	\N	2025-06-17 21:23:10.723	2025-06-17 21:23:10.734013
34	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	بازیابی رمز عبور - Momtaz Chemical	sent	\N	2025-06-17 21:25:17.937	2025-06-17 21:25:17.948473
35	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	بازیابی رمز عبور - Momtaz Chemical	sent	\N	2025-06-17 21:33:46.171	2025-06-17 21:33:46.184971
36	1	\N	\N	admin@momtazchem.com	info@momtazchem.com	New Contact Form Submission from محمدرضا غفاری	sent	\N	2025-06-17 22:03:52.876	2025-06-17 22:03:52.888217
37	1	\N	\N	mr.ghafari@gmail.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - محمدرضا غفاری	sent	\N	2025-06-17 22:03:52.91	2025-06-17 22:03:52.921506
41	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	Password Reset Email (Failed)	failed	nodemailer.createTransporter is not a function	2025-06-20 14:30:36.995	2025-06-20 14:30:37.00838
42	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	Password Reset Email (Failed)	failed	nodemailer.createTransporter is not a function	2025-06-20 14:30:44.664	2025-06-20 14:30:44.676329
43	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	Password Reset Email (Failed)	failed	nodemailer.createTransporter is not a function	2025-06-20 14:31:24.499	2025-06-20 14:31:24.512072
44	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	بازیابی رمز عبور - Momtaz Chemical	sent	\N	2025-06-20 14:35:30.711	2025-06-20 14:35:30.724599
45	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	Password Reset - Momtaz Chemical	sent	\N	2025-06-20 14:39:19.301	2025-06-20 14:39:19.314591
46	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	Password Reset - Momtaz Chemical	sent	\N	2025-06-20 14:42:36.571	2025-06-20 14:42:36.585481
47	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	Password Reset - Momtaz Chemical	sent	\N	2025-06-20 14:49:48.902	2025-06-20 14:49:48.915051
48	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	Password Reset - Momtaz Chemical	sent	\N	2025-06-20 15:03:37.243	2025-06-20 15:03:37.261709
49	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	Password Reset - Momtaz Chemical	sent	\N	2025-06-20 15:07:38.841	2025-06-20 15:07:38.852935
50	1	\N	\N	admin@momtazchem.com	info@momtazchem.com	New Contact Form Submission from Mohammadreza Ghafari	sent	\N	2025-06-24 15:32:49.177	2025-06-24 15:32:49.188567
51	1	\N	\N	mr.ghafari@gmail.com	info@momtazchem.com	Thank you for contacting Momtaz Chemical - Mohammadreza Ghafari	sent	\N	2025-06-24 15:32:49.205	2025-06-24 15:32:49.216249
52	1	\N	\N	mr.ghafari@yahoo.com	info@momtazchem.com	Password Reset - Momtaz Chemical	sent	\N	2025-06-24 16:59:38.84	2025-06-24 16:59:38.854173
53	1	\N	\N	info@momtazchem.com	info@momtazchem.com	کد بازیابی رمز عبور - مومتاز کمیکال	sent	\N	2025-06-26 16:33:06.936	2025-06-26 16:33:06.948549
54	1	\N	\N	info@momtazchem.com	info@momtazchem.com	کد بازیابی رمز عبور - مومتاز کمیکال	sent	\N	2025-06-26 16:45:31.91	2025-06-26 16:45:31.923436
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
-- Data for Name: inquiry_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inquiry_responses (id, inquiry_id, sender_id, sender_type, message, attachments, is_internal, read_at, created_at) FROM stdin;
1	8	1	admin	adgadg	\N	f	\N	2025-06-17 22:43:36.374127
2	8	1	admin	مقدار 500 تن برای اول	\N	f	\N	2025-06-17 22:44:58.655273
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
-- Data for Name: multilingual_keywords; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.multilingual_keywords (id, seo_setting_id, keyword, language, search_volume, difficulty, current_position, target_position, is_tracking, last_checked, created_at, updated_at) FROM stdin;
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
38	21	3	Fuel System Cleaner Premium FSC-Pro	FSC-PRO-500ML	1.000	28.75	28.75	\N	2025-06-20 15:11:50.620201	units	\N	\N
39	21	14	Fuel System Cleaner Pro	SP-1-FUEL-SYSTE	1.000	50.00	50.00	\N	2025-06-20 15:11:50.647087	units	\N	\N
40	22	3	Fuel System Cleaner Premium FSC-Pro	FSC-PRO-500ML	1.000	28.75	28.75	\N	2025-06-24 17:05:30.117033	units	\N	\N
41	22	4	Diesel Anti-Gel Additive DAG-Winter	DAG-WINTER-250ML	1.000	15.25	15.25	\N	2025-06-24 17:05:30.153656	units	\N	\N
42	22	14	Fuel System Cleaner Pro	SP-1-FUEL-SYSTE	1.000	50.00	50.00	\N	2025-06-24 17:05:30.176857	units	\N	\N
43	23	3	Fuel System Cleaner Premium FSC-Pro	FSC-PRO-500ML	1.000	28.75	28.75	\N	2025-06-24 17:06:26.082456	units	\N	\N
44	23	14	Fuel System Cleaner Pro	SP-1-FUEL-SYSTE	1.000	50.00	50.00	\N	2025-06-24 17:06:26.106774	units	\N	\N
45	24	3	Fuel System Cleaner Premium FSC-Pro	FSC-PRO-500ML	1.000	28.75	28.75	\N	2025-06-25 07:56:22.178578	units	\N	\N
46	24	14	Fuel System Cleaner Pro	SP-1-FUEL-SYSTE	1.000	50.00	50.00	\N	2025-06-25 07:56:22.205788	units	\N	\N
47	25	1	Industrial Water Clarifier WC-500	WC-500-5L	1.000	45.99	45.99	\N	2025-06-25 21:52:04.301726	units	\N	\N
\.


--
-- Data for Name: order_management; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_management (id, customer_order_id, current_status, delivery_code, financial_reviewer_id, financial_reviewed_at, financial_notes, payment_receipt_url, warehouse_assignee_id, warehouse_processed_at, warehouse_notes, logistics_assignee_id, logistics_processed_at, logistics_notes, tracking_number, estimated_delivery_date, actual_delivery_date, delivery_person_name, delivery_person_phone, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_status_history (id, order_management_id, from_status, to_status, changed_by, changed_by_department, notes, created_at) FROM stdin;
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
20	mr.ghafari@yahoo.com	enci4d5vopo6bm6qcmh0mp	2025-06-24 17:59:35.669	f	2025-06-24 16:59:35.810956
\.


--
-- Data for Name: payment_receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_receipts (id, customer_order_id, customer_id, receipt_url, original_file_name, file_size, mime_type, uploaded_at, notes) FROM stdin;
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
-- Data for Name: redirects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.redirects (id, from_url, to_url, status_code, is_active, hit_count, created_at, updated_at) FROM stdin;
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
-- Data for Name: seo_analytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.seo_analytics (id, seo_setting_id, page_url, impressions, clicks, "position", ctr, date_recorded, source, language, country, device) FROM stdin;
\.


--
-- Data for Name: seo_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.seo_settings (id, page_type, page_identifier, title, description, keywords, og_title, og_description, og_image, twitter_title, twitter_description, twitter_image, canonical_url, robots, schema, is_active, priority, created_at, updated_at, language, hreflang_url) FROM stdin;
1	global	\N	شرکت شیمیایی ایران - محصولات شیمیایی و کشاورزی	تولیدکننده محصولات شیمیایی، کودهای کشاورزی، مواد افزودنی سوخت و محصولات تصفیه آب با کیفیت بالا	\N	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	100	2025-06-18 08:33:44.384427	2025-06-18 08:33:44.384427	fa	\N
2	home	\N	صفحه اصلی - شرکت شیمیایی ایران	خانه محصولات شیمیایی برتر ایران. ما تولیدکننده کودهای NPK، مواد افزودنی سوخت، و سیستم‌های تصفیه آب هستیم	\N	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	90	2025-06-18 08:33:44.384427	2025-06-18 08:33:44.384427	fa	\N
3	products	\N	محصولات شیمیایی - کاتالوگ کامل	مشاهده کامل محصولات شیمیایی شامل کودهای کشاورزی، مواد افزودنی سوخت، تصفیه آب و رنگ‌ها	\N	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	85	2025-06-18 08:33:44.384427	2025-06-18 08:33:44.384427	fa	\N
4	contact	\N	تماس با ما - شرکت شیمیایی ایران	برای مشاوره و خرید محصولات شیمیایی با ما تماس بگیرید. خدمات فنی و پشتیبانی تخصصی	\N	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	70	2025-06-18 08:33:44.384427	2025-06-18 08:33:44.384427	fa	\N
5	about	\N	درباره ما - شرکت شیمیایی ایران	بیش از 20 سال تجربه در تولید محصولات شیمیایی با استانداردهای بین‌المللی و خدمات مشتریان	\N	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	60	2025-06-18 08:33:44.384427	2025-06-18 08:33:44.384427	fa	\N
6	global	\N	Iran Chemical Company - High-Quality Chemical Products & Agricultural Solutions	Leading manufacturer of chemical products, agricultural fertilizers, fuel additives, and water treatment systems with international standards	chemical products, agricultural fertilizers, fuel additives, water treatment, Iran chemicals	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	100	2025-06-18 09:01:06.971777	2025-06-18 09:01:06.971777	en	\N
7	home	\N	Home - Iran Chemical Company	Welcome to Iran's premier chemical products manufacturer. We produce NPK fertilizers, fuel additives, and water treatment systems	chemical manufacturer, NPK fertilizer, fuel additives, water treatment systems	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	90	2025-06-18 09:01:06.971777	2025-06-18 09:01:06.971777	en	\N
8	products	\N	Chemical Products - Complete Catalog	Browse our complete range of chemical products including agricultural fertilizers, fuel additives, water treatment solutions, and paints	chemical products catalog, fertilizers, fuel additives, water treatment, industrial chemicals	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	85	2025-06-18 09:01:06.971777	2025-06-18 09:01:06.971777	en	\N
9	global	\N	شركة إيران الكيميائية - منتجات كيميائية عالية الجودة وحلول زراعية	الشركة الرائدة في تصنيع المنتجات الكيميائية والأسمدة الزراعية والمضافات الوقود وأنظمة معالجة المياه بمعايير دولية	منتجات كيميائية, أسمدة زراعية, مضافات الوقود, معالجة المياه, كيماويات إيران	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	100	2025-06-18 09:01:06.971777	2025-06-18 09:01:06.971777	ar	\N
10	home	\N	الرئيسية - شركة إيران الكيميائية	مرحباً بكم في أكبر مصنع للمنتجات الكيميائية في إيران. نحن ننتج أسمدة NPK ومضافات الوقود وأنظمة معالجة المياه	مصنع كيماويات, أسمدة NPK, مضافات الوقود, أنظمة معالجة المياه	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	90	2025-06-18 09:01:06.971777	2025-06-18 09:01:06.971777	ar	\N
11	products	\N	المنتجات الكيميائية - الكتالوج الكامل	تصفح مجموعتنا الكاملة من المنتجات الكيميائية بما في ذلك الأسمدة الزراعية ومضافات الوقود وحلول معالجة المياه والدهانات	كتالوج المنتجات الكيميائية, أسمدة, مضافات الوقود, معالجة المياه, كيماويات صناعية	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	85	2025-06-18 09:01:06.971777	2025-06-18 09:01:06.971777	ar	\N
12	global	\N	کۆمپانیای کیمیایی ئێران - بەرهەمە کیمیاییەکانی کوالیتی بەرز و چارەسەرە کشتوکاڵییەکان	بەرهەمهێنەری سەرەکی بەرهەمە کیمیاییەکان، پەینی کشتوکاڵی، زیادکەرەکانی سووتەمەنی و سیستەمەکانی پاککردنەوەی ئاو بە ستانداردە نێودەوڵەتییەکان	بەرهەمە کیمیاییەکان, پەینی کشتوکاڵی, زیادکەرەکانی سووتەمەنی, پاککردنەوەی ئاو, کیمیای ئێران	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	100	2025-06-18 09:01:06.971777	2025-06-18 09:01:06.971777	ku	\N
13	home	\N	سەرەتا - کۆمپانیای کیمیایی ئێران	بەخێربێن بۆ گەورەترین بەرهەمهێنەری بەرهەمە کیمیاییەکان لە ئێران. ئێمە پەینی NPK، زیادکەرەکانی سووتەمەنی و سیستەمەکانی پاککردنەوەی ئاو بەرهەم دەهێنین	بەرهەمهێنەری کیمیایی, پەینی NPK, زیادکەرەکانی سووتەمەنی, سیستەمەکانی پاککردنەوەی ئاو	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	90	2025-06-18 09:01:06.971777	2025-06-18 09:01:06.971777	ku	\N
14	global	\N	İran Kimya Şirketi - Yüksek Kaliteli Kimyasal Ürünler ve Tarımsal Çözümler	Uluslararası standartlarda kimyasal ürünler, tarımsal gübreler, yakıt katkıları ve su arıtma sistemleri üreticisi önde gelen şirket	kimyasal ürünler, tarımsal gübreler, yakıt katkıları, su arıtma, İran kimyasalları	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	100	2025-06-18 09:01:06.971777	2025-06-18 09:01:06.971777	tr	\N
15	home	\N	Ana Sayfa - İran Kimya Şirketi	İran'ın önde gelen kimyasal ürün üreticisine hoş geldiniz. NPK gübreler, yakıt katkıları ve su arıtma sistemleri üretiyoruz	kimya üreticisi, NPK gübre, yakıt katkıları, su arıtma sistemleri	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	90	2025-06-18 09:01:06.971777	2025-06-18 09:01:06.971777	tr	\N
16	products	\N	Kimyasal Ürünler - Tam Katalog	Tarımsal gübreler, yakıt katkıları, su arıtma çözümleri ve boyalar dahil olmak üzere tam kimyasal ürün yelpazemize göz atın	kimyasal ürün kataloğu, gübreler, yakıt katkıları, su arıtma, endüstriyel kimyasallar	\N	\N	\N	\N	\N	\N	\N	index,follow	\N	t	85	2025-06-18 09:01:06.971777	2025-06-18 09:01:06.971777	tr	\N
\.


--
-- Data for Name: shop_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shop_categories (id, name, slug, description, image_url, parent_id, is_active, display_order, meta_title, meta_description, created_at, updated_at) FROM stdin;
3	Paint & Solvents	paint-solvents	Industrial paint thinners and solvents	\N	\N	t	3	\N	\N	2025-06-13 01:50:47.257527	2025-06-13 01:50:47.257527
4	Agricultural Products	agricultural	Fertilizers and agricultural chemicals	\N	\N	t	4	\N	\N	2025-06-13 01:50:47.257527	2025-06-13 01:50:47.257527
5	Agricultural Fertilizers	agricultural-fertilizers	Chemical fertilizers and plant nutrients	\N	\N	t	5	\N	\N	2025-06-18 08:02:59.367944	2025-06-18 08:02:59.367944
6	Industrial Chemicals	chemicals	Various chemicals for industrial applications	\N	\N	t	6	\N	\N	2025-06-18 08:02:59.367944	2025-06-18 08:02:59.367944
7	Paint Thinner	paint-thinner	Industrial thinners and paint solvents	\N	\N	t	7	\N	\N	2025-06-18 08:02:59.367944	2025-06-18 08:02:59.367944
1	Water Treatment	water-treatment	Professional water treatment chemicals and solutions		\N	t	1			2025-06-13 01:50:47.257527	2025-06-18 09:35:27.248
9	Technical equipment	technical-equipment			\N	t	2			2025-06-25 12:24:11.392596	2025-06-25 12:27:51.465
10	Commercial goods	commercial-goods			\N	t	8			2025-06-25 12:26:56.23531	2025-06-25 12:28:17.129
2	Fuel Additives	fuel-additives	High-performance fuel system cleaners and additives		\N	t	9			2025-06-13 01:50:47.257527	2025-06-25 12:28:28.24
\.


--
-- Data for Name: shop_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shop_products (id, name, category, description, short_description, price, compare_at_price, price_unit, in_stock, stock_quantity, low_stock_threshold, sku, barcode, weight, weight_unit, dimensions, image_urls, thumbnail_url, specifications, features, applications, tags, minimum_order_quantity, maximum_order_quantity, lead_time, shipping_class, tax_class, is_active, is_featured, meta_title, meta_description, created_at, updated_at, quantity_discounts) FROM stdin;
13	NPK Fertilizer Complex	Agricultural Fertilizers	Balanced NPK fertilizer for optimal crop growth	\N	50.00	\N	unit	t	75	15	SP-4-NPK-FERTIL	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-26 14:23:18.275	\N
14	Fuel System Cleaner Pro	fuel-additives	Advanced fuel system cleaner that removes deposits and improves engine performance	\N	50.00	\N	unit	t	150	20	SP-1-FUEL-SYSTE	\N	\N	kg	\N	["/uploads/images/product-1749823118120-593693181.jpeg"]	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-26 14:23:18.322	\N
15	Water Treatment Chemical A1	water-treatment	High-quality water treatment solution for industrial applications	\N	50.00	\N	unit	t	16	25	SP-2-WATER-TREA	\N	\N	kg	\N	["/uploads/images/product-1749822983330-60758320.jpeg"]	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-26 14:39:52.067	\N
5	Paint Thinner Professional PT-Grade	Paint & Solvents	High-quality paint thinner for professional painting applications. Fast-evaporating and residue-free.	Professional grade paint thinner	22.00	\N	per 1L	t	0	5	PT-GRADE-1L	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 01:50:58.996872	\N
1	Industrial Water Clarifier WC-500	Water Treatment	High-performance water clarifying agent for industrial applications. Removes suspended particles and turbidity effectively.	Professional water clarifier for industrial use	45.99	\N	per 5L	t	24	10	WC-500-5L	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 01:59:12.64	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
2	Pool Chlorine Stabilizer CS-100	Water Treatment	Cyanuric acid-based stabilizer that protects chlorine from UV degradation in swimming pools and water systems.	UV-resistant chlorine stabilizer	32.50	\N	per 10kg	t	39	10	CS-100-10KG	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 02:01:50.083	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
18	تس 123	تست 2	سسش	\N	50.00	\N	unit	t	0	10	SP-6-تس-123	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-18 12:29:08.895586	2025-06-25 12:32:23.996	\N
16	محصول تست لیزر اسکنر	Industrial Chemicals	محصول تستی برای آزمایش لیزر اسکنر USB	\N	250.00	\N	per unit	t	100	20	USB-TEST-001	1234567890123	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-14 10:07:14.379112	2025-06-14 10:07:14.379112	\N
3	Fuel System Cleaner Premium FSC-Pro	Fuel Additives	Advanced fuel injector cleaner that removes carbon deposits and improves engine performance. Compatible with gasoline and diesel.	Premium fuel system cleaner	28.75	\N	per 500ml	t	57	10	FSC-PRO-500ML	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-14 09:31:14.542	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
6	NPK Fertilizer Complex 20-10-10	Agricultural Products	Balanced NPK fertilizer with nitrogen, phosphorus, and potassium for optimal plant growth and yield.	Balanced NPK fertilizer complex	65.00	\N	per 25kg	t	-7	10	NPK-201010-25KG	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-13 01:50:58.996872	2025-06-13 02:34:25.517	[\n  {"minQty": 5, "discount": 0.03},\n  {"minQty": 20, "discount": 0.08},\n  {"minQty": 100, "discount": 0.20}\n]
19	گل حفاری	Commercial goods		\N	50.00	\N	unit	t	120	10	SP-6-گل-حفاری	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-25 12:37:08.364267	2025-06-26 14:23:18.13	\N
4	Diesel Anti-Gel Additive DAG-Winter	Fuel Additives	Prevents fuel gelling in cold weather conditions. Improves cold flow properties of diesel fuel.	Winter diesel anti-gel protection	15.25	\N	per 250ml	t	-22	5	DAG-WINTER-250ML	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 01:50:58.996872	2025-06-14 09:34:50.592	[\n  {"minQty": 10, "discount": 0.05},\n  {"minQty": 25, "discount": 0.10},\n  {"minQty": 50, "discount": 0.15}\n]
17	سشسششس	تست 2	سسش	\N	50.00	\N	unit	t	0	10	SP-6-سشسششس	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-18 12:27:17.993453	2025-06-18 12:28:10.793	\N
12	Premium Paint Thinner	paint-thinner	Professional grade paint thinner for industrial use	\N	50.00	\N	unit	t	0	30	SP-3-PREMIUM-PA	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-13 02:56:12.33939	2025-06-26 14:23:18.181	\N
20	Premium Water Treatment Chemical	Water Treatment	High-quality water treatment solution for industrial applications	\N	45.99	\N	liter	t	150	10	WTC-001	\N	\N	kg	\N	\N	\N	\N	\N	\N	["water", "treatment", "industrial", "premium"]	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-25 18:20:55.842162	2025-06-25 18:20:55.842162	\N
21	Advanced Fuel Additive	Fuel Additives	Performance enhancing fuel additive for automotive use	\N	29.99	\N	bottle	t	200	10	FA-002	\N	\N	kg	\N	\N	\N	\N	\N	\N	["fuel", "additive", "automotive", "performance"]	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-25 18:20:55.842162	2025-06-25 18:20:55.842162	\N
22	Professional Paint Thinner	Paint & Solvents	High-grade paint thinner for professional use	\N	19.99	\N	liter	t	80	10	PT-003	\N	\N	kg	\N	\N	\N	\N	\N	\N	["paint", "thinner", "solvent", "professional"]	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-25 18:20:55.842162	2025-06-25 18:20:55.842162	\N
23	Agricultural Fertilizer Mix	Agricultural Fertilizers	Balanced fertilizer mixture for crop enhancement	\N	35.50	\N	kg	t	120	10	AF-004	\N	\N	kg	\N	\N	\N	\N	\N	\N	["fertilizer", "agriculture", "crops", "organic"]	1	\N	\N	\N	standard	t	t	\N	\N	2025-06-25 18:20:55.842162	2025-06-25 18:20:55.842162	\N
24	Industrial Cleaning Solution	Cleaning Chemicals	Heavy-duty industrial cleaning concentrate	\N	52.00	\N	liter	t	90	10	ICS-005	\N	\N	kg	\N	\N	\N	\N	\N	\N	["cleaning", "industrial", "concentrate", "heavy-duty"]	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-25 18:20:55.842162	2025-06-25 18:20:55.842162	\N
25	Clue	laboratory		\N	50.00	\N	unit	t	120	10	SP-6-CLUE	\N	\N	kg	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	standard	t	f	\N	\N	2025-06-26 14:30:33.241377	2025-06-26 14:30:33.241377	\N
\.


--
-- Data for Name: showcase_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.showcase_products (id, name, category, description, short_description, price_range, image_url, pdf_catalog_url, specifications, features, applications, technical_data_sheet_url, safety_data_sheet_url, certifications, is_active, display_order, created_at, updated_at, stock_quantity, min_stock_level, max_stock_level, stock_unit, inventory_status, last_restock_date, supplier, warehouse_location, batch_number, expiry_date, barcode, qr_code, sku, unit_price, currency) FROM stdin;
3	Premium Paint Thinner	paint-thinner	Professional grade paint thinner for industrial use	Industrial paint thinner	Contact for pricing	\N	\N	{}	{}	{}	\N	\N	{}	t	3	2025-06-12 15:01:26.313404	2025-06-13 18:20:35.116	0	30	200	liters	out_of_stock	\N	PaintTech Industries	Erbil Storage B	PT2024003	\N	0000000003	\N	SKU0003	0.00	USD
4	NPK Fertilizer Complex	Agricultural Fertilizers	Balanced NPK fertilizer for optimal crop growth	Balanced NPK fertilizer	Contact for pricing			\N	\N	{}	\N	\N	{}	t	4	2025-06-12 15:01:26.313404	2025-06-26 14:21:10.923	75	15	400	kg	in_stock	\N	AgriChem Ltd	Erbil Main Warehouse	AG2024004	\N	\N	\N	\N	0.00	USD
1	Fuel System Cleaner Pro	fuel-additives	Advanced fuel system cleaner that removes deposits and improves engine performance	Professional grade fuel system cleaner	Contact for pricing	/uploads/images/product-1749823118120-593693181.jpeg		\N	\N	\N			\N	t	1	2025-06-12 15:01:26.313404	2025-06-26 14:21:46.298	150	20	500	liters	in_stock	\N	ChemCorp Industries	Erbil Main Warehouse	FC2024001	\N	\N	\N	\N	25.50	USD
6	Clue	laboratory		گل حفاری	Contact for pricing		/uploads/catalogs/catalog-1750947541310-365412876.pdf	\N	\N	\N			\N	t	0	2025-06-18 12:27:17.935038	2025-06-26 14:30:32.989	120	10	1000	kg	in_stock	\N				\N	99985	\N	\N	75.25	EUR
2	Water Treatment Chemical A1	water-treatment	High-quality water treatment solution for industrial applications	Industrial water treatment solution	Contact for pricing	/uploads/images/product-1749822983330-60758320.jpeg	/uploads/catalogs/catalog-1750948780160-425470799.pdf	\N	\N	\N			\N	t	2	2025-06-12 15:01:26.313404	2025-06-26 14:39:47.27	16	25	300	liters	low_stock	\N	AquaTech Solutions	Erbil Main Warehouse	WT2024002	\N	\N	\N	\N	0.00	USD
\.


--
-- Data for Name: sitemap_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sitemap_entries (id, url, priority, change_freq, last_modified, is_active, page_type, created_at, language) FROM stdin;
1	/	1.00	daily	2025-06-18 08:33:47.132312	t	home	2025-06-18 08:33:47.132312	fa
2	/products	0.90	weekly	2025-06-18 08:33:47.132312	t	products	2025-06-18 08:33:47.132312	fa
3	/products/fuel-additives	0.80	monthly	2025-06-18 08:33:47.132312	t	category	2025-06-18 08:33:47.132312	fa
4	/products/water-treatment	0.80	monthly	2025-06-18 08:33:47.132312	t	category	2025-06-18 08:33:47.132312	fa
5	/products/agricultural-fertilizers	0.80	monthly	2025-06-18 08:33:47.132312	t	category	2025-06-18 08:33:47.132312	fa
6	/products/paint-thinner	0.80	monthly	2025-06-18 08:33:47.132312	t	category	2025-06-18 08:33:47.132312	fa
7	/about	0.60	monthly	2025-06-18 08:33:47.132312	t	page	2025-06-18 08:33:47.132312	fa
8	/contact	0.70	monthly	2025-06-18 08:33:47.132312	t	page	2025-06-18 08:33:47.132312	fa
9	/shop	0.80	weekly	2025-06-18 08:33:47.132312	t	shop	2025-06-18 08:33:47.132312	fa
\.


--
-- Data for Name: sms_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sms_settings (id, is_enabled, provider, api_key, api_secret, sender_number, code_length, code_expiry, max_attempts, rate_limit_minutes, created_at, updated_at) FROM stdin;
1	f	kavenegar	\N	\N	\N	6	300	3	60	2025-06-25 21:49:46.576059	2025-06-25 23:10:03.331
\.


--
-- Data for Name: sms_verifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sms_verifications (id, phone, code, purpose, expires_at, is_used, attempts, created_at) FROM stdin;
\.


--
-- Data for Name: smtp_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.smtp_settings (id, category_id, host, port, secure, username, password, from_name, from_email, is_active, test_status, last_tested, created_at, updated_at) FROM stdin;
2	4	smtppro.zoho.eu	587	t	fertilizer@momtazchem.com	Fertilizer@123	Momtaz Fertilizer	fertilizer@momtazchem.com	t	untested	\N	2025-06-18 07:51:15.127618	2025-06-18 07:51:15.127618
1	1	smtppro.zoho.eu	587	t	info@momtazchem.com	RkBTW6W7Qqt7	Momtaz Chemical	info@momtazchem.com	t	success	2025-06-24 19:22:14.462	2025-06-14 07:44:49.94626	2025-06-24 19:22:14.462
\.


--
-- Data for Name: super_admin_verifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.super_admin_verifications (id, user_id, email, phone, verification_code, type, is_used, expires_at, created_at) FROM stdin;
4	1	info@momtazchem.com	\N	195061	password_reset	t	2025-06-26 17:03:04.23	2025-06-26 16:33:04.258
7	1	info@momtazchem.com	\N	051923	password_reset	f	2025-06-26 17:15:29.655	2025-06-26 16:45:29.718
8	1	info@momtazchem.com	\N	040213	email	t	2025-06-26 17:02:16.709	2025-06-26 16:47:16.732
9	7	admin@momtazchem.com	\N	224837	email	f	2025-06-26 17:05:43.914	2025-06-26 16:50:43.942
\.


--
-- Data for Name: supported_languages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supported_languages (id, code, name, native_name, direction, is_default, is_active, priority, google_analytics_code, search_console_property, created_at, updated_at) FROM stdin;
1	fa	Persian	فارسی	rtl	t	t	100	\N	\N	2025-06-18 08:59:13.7339	2025-06-18 08:59:13.7339
2	en	English	English	ltr	f	t	90	\N	\N	2025-06-18 08:59:13.7339	2025-06-18 08:59:13.7339
3	ar	Arabic	العربية	rtl	f	t	80	\N	\N	2025-06-18 08:59:13.7339	2025-06-18 08:59:13.7339
6	ku	Kurdish	کوردی	rtl	f	t	70	\N	\N	2025-06-18 09:00:45.765949	2025-06-18 09:00:45.765949
7	tr	Turkish	Türkçe	ltr	f	t	60	\N	\N	2025-06-18 09:00:45.765949	2025-06-18 09:00:45.765949
\.


--
-- Data for Name: user_widget_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_widget_preferences (id, user_id, widget_id, is_visible, "position", size, custom_settings, last_accessed_at, access_count, is_starred, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password_hash, is_active, created_at, updated_at, role_id, last_login_at, phone, email_verified, phone_verified, department) FROM stdin;
7	Omid Mohammad	admin@momtazchem.com	$2b$10$msEm51up9IdaI3IGe84SwuNiRpCixrGTN30F/kc4byXEEerIxHSPm	t	2025-06-26 16:19:02.331	2025-06-26 16:19:02.331	\N	\N	\N	f	f	super_admin
1	info@momtazchem.com	info@momtazchem.com	$2b$10$GYqQMc15BuJKkoSQdMzKG.q0q3DG3EUH..vQgYcQ.eOPqEZEumF5G	t	2025-06-12 08:17:29.164005	2025-06-26 16:34:15.373	1	\N	\N	t	f	super_admin
\.


--
-- Data for Name: widget_recommendations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.widget_recommendations (id, user_id, widget_id, score, reason, explanation, is_accepted, is_dismissed, generated_at, expires_at, metadata) FROM stdin;
\.


--
-- Data for Name: widget_usage_analytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.widget_usage_analytics (id, user_id, widget_id, action, duration, session_id, user_agent, ip_address, metadata, created_at) FROM stdin;
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

SELECT pg_catalog.setval('public.contacts_id_seq', 31, true);


--
-- Name: crm_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.crm_customers_id_seq', 22, true);


--
-- Name: customer_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_activities_id_seq', 842, true);


--
-- Name: customer_addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_addresses_id_seq', 4, true);


--
-- Name: customer_inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_inquiries_id_seq', 8, true);


--
-- Name: customer_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_orders_id_seq', 25, true);


--
-- Name: customer_segments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_segments_id_seq', 1, false);


--
-- Name: customer_sms_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_sms_settings_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 32, true);


--
-- Name: dashboard_widgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dashboard_widgets_id_seq', 8, true);


--
-- Name: delivery_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.delivery_codes_id_seq', 1, false);


--
-- Name: department_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.department_assignments_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.email_logs_id_seq', 54, true);


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
-- Name: inquiry_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inquiry_responses_id_seq', 2, true);


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
-- Name: multilingual_keywords_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.multilingual_keywords_id_seq', 1, false);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_items_id_seq', 47, true);


--
-- Name: order_management_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_management_id_seq', 1, false);


--
-- Name: order_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_status_history_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 11, true);


--
-- Name: password_resets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_resets_id_seq', 20, true);


--
-- Name: payment_receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_receipts_id_seq', 1, false);


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
-- Name: redirects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.redirects_id_seq', 1, false);


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
-- Name: seo_analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.seo_analytics_id_seq', 1, false);


--
-- Name: seo_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.seo_settings_id_seq', 16, true);


--
-- Name: shop_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shop_categories_id_seq', 10, true);


--
-- Name: shop_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shop_products_id_seq', 25, true);


--
-- Name: showcase_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.showcase_products_id_seq', 6, true);


--
-- Name: sitemap_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sitemap_entries_id_seq', 10, true);


--
-- Name: sms_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sms_settings_id_seq', 1, true);


--
-- Name: sms_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sms_verifications_id_seq', 1, false);


--
-- Name: smtp_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.smtp_settings_id_seq', 2, true);


--
-- Name: super_admin_verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.super_admin_verifications_id_seq', 9, true);


--
-- Name: supported_languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.supported_languages_id_seq', 7, true);


--
-- Name: user_widget_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_widget_preferences_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: widget_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.widget_recommendations_id_seq', 1, false);


--
-- Name: widget_usage_analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.widget_usage_analytics_id_seq', 1, false);


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
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


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
-- Name: customer_sms_settings customer_sms_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_sms_settings
    ADD CONSTRAINT customer_sms_settings_pkey PRIMARY KEY (id);


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
-- Name: dashboard_widgets dashboard_widgets_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_widgets
    ADD CONSTRAINT dashboard_widgets_name_key UNIQUE (name);


--
-- Name: dashboard_widgets dashboard_widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_widgets
    ADD CONSTRAINT dashboard_widgets_pkey PRIMARY KEY (id);


--
-- Name: delivery_codes delivery_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_codes
    ADD CONSTRAINT delivery_codes_code_key UNIQUE (code);


--
-- Name: delivery_codes delivery_codes_order_management_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_codes
    ADD CONSTRAINT delivery_codes_order_management_id_key UNIQUE (order_management_id);


--
-- Name: delivery_codes delivery_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_codes
    ADD CONSTRAINT delivery_codes_pkey PRIMARY KEY (id);


--
-- Name: department_assignments department_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.department_assignments
    ADD CONSTRAINT department_assignments_pkey PRIMARY KEY (id);


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
-- Name: inquiry_responses inquiry_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_responses
    ADD CONSTRAINT inquiry_responses_pkey PRIMARY KEY (id);


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
-- Name: multilingual_keywords multilingual_keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multilingual_keywords
    ADD CONSTRAINT multilingual_keywords_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_management order_management_customer_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_management
    ADD CONSTRAINT order_management_customer_order_id_key UNIQUE (customer_order_id);


--
-- Name: order_management order_management_delivery_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_management
    ADD CONSTRAINT order_management_delivery_code_key UNIQUE (delivery_code);


--
-- Name: order_management order_management_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_management
    ADD CONSTRAINT order_management_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


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
-- Name: payment_receipts payment_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_receipts
    ADD CONSTRAINT payment_receipts_pkey PRIMARY KEY (id);


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
-- Name: redirects redirects_from_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redirects
    ADD CONSTRAINT redirects_from_url_key UNIQUE (from_url);


--
-- Name: redirects redirects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redirects
    ADD CONSTRAINT redirects_pkey PRIMARY KEY (id);


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
-- Name: seo_analytics seo_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_analytics
    ADD CONSTRAINT seo_analytics_pkey PRIMARY KEY (id);


--
-- Name: seo_settings seo_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_settings
    ADD CONSTRAINT seo_settings_pkey PRIMARY KEY (id);


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
-- Name: sitemap_entries sitemap_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_entries
    ADD CONSTRAINT sitemap_entries_pkey PRIMARY KEY (id);


--
-- Name: sitemap_entries sitemap_entries_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_entries
    ADD CONSTRAINT sitemap_entries_url_key UNIQUE (url);


--
-- Name: sms_settings sms_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_settings
    ADD CONSTRAINT sms_settings_pkey PRIMARY KEY (id);


--
-- Name: sms_verifications sms_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_verifications
    ADD CONSTRAINT sms_verifications_pkey PRIMARY KEY (id);


--
-- Name: smtp_settings smtp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smtp_settings
    ADD CONSTRAINT smtp_settings_pkey PRIMARY KEY (id);


--
-- Name: super_admin_verifications super_admin_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admin_verifications
    ADD CONSTRAINT super_admin_verifications_pkey PRIMARY KEY (id);


--
-- Name: supported_languages supported_languages_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supported_languages
    ADD CONSTRAINT supported_languages_code_key UNIQUE (code);


--
-- Name: supported_languages supported_languages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supported_languages
    ADD CONSTRAINT supported_languages_pkey PRIMARY KEY (id);


--
-- Name: user_widget_preferences user_widget_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_widget_preferences
    ADD CONSTRAINT user_widget_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_widget_preferences user_widget_preferences_user_id_widget_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_widget_preferences
    ADD CONSTRAINT user_widget_preferences_user_id_widget_id_key UNIQUE (user_id, widget_id);


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
-- Name: widget_recommendations widget_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widget_recommendations
    ADD CONSTRAINT widget_recommendations_pkey PRIMARY KEY (id);


--
-- Name: widget_usage_analytics widget_usage_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widget_usage_analytics
    ADD CONSTRAINT widget_usage_analytics_pkey PRIMARY KEY (id);


--
-- Name: idx_delivery_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_delivery_codes_code ON public.delivery_codes USING btree (code);


--
-- Name: idx_delivery_codes_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_delivery_codes_order ON public.delivery_codes USING btree (order_management_id);


--
-- Name: idx_department_assignments_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_department_assignments_dept ON public.department_assignments USING btree (department);


--
-- Name: idx_department_assignments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_department_assignments_user ON public.department_assignments USING btree (admin_user_id);


--
-- Name: idx_order_management_customer_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_management_customer_order ON public.order_management USING btree (customer_order_id);


--
-- Name: idx_order_management_delivery_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_management_delivery_code ON public.order_management USING btree (delivery_code);


--
-- Name: idx_order_management_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_management_status ON public.order_management USING btree (current_status);


--
-- Name: idx_order_status_history_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_status_history_order ON public.order_status_history USING btree (order_management_id);


--
-- Name: idx_order_status_history_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_status_history_status ON public.order_status_history USING btree (to_status);


--
-- Name: idx_payment_receipts_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_receipts_customer ON public.payment_receipts USING btree (customer_id);


--
-- Name: idx_payment_receipts_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_receipts_order ON public.payment_receipts USING btree (customer_order_id);


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
-- Name: inquiry_responses inquiry_responses_inquiry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_responses
    ADD CONSTRAINT inquiry_responses_inquiry_id_fkey FOREIGN KEY (inquiry_id) REFERENCES public.customer_inquiries(id) ON DELETE CASCADE;


--
-- Name: inquiry_responses inquiry_responses_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_responses
    ADD CONSTRAINT inquiry_responses_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: inventory_movements inventory_movements_raw_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_raw_material_id_fkey FOREIGN KEY (raw_material_id) REFERENCES public.raw_materials(id);


--
-- Name: multilingual_keywords multilingual_keywords_seo_setting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multilingual_keywords
    ADD CONSTRAINT multilingual_keywords_seo_setting_id_fkey FOREIGN KEY (seo_setting_id) REFERENCES public.seo_settings(id);


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
-- Name: seo_analytics seo_analytics_seo_setting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_analytics
    ADD CONSTRAINT seo_analytics_seo_setting_id_fkey FOREIGN KEY (seo_setting_id) REFERENCES public.seo_settings(id);


--
-- Name: smtp_settings smtp_settings_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smtp_settings
    ADD CONSTRAINT smtp_settings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.email_categories(id);


--
-- Name: super_admin_verifications super_admin_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_admin_verifications
    ADD CONSTRAINT super_admin_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_widget_preferences user_widget_preferences_widget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_widget_preferences
    ADD CONSTRAINT user_widget_preferences_widget_id_fkey FOREIGN KEY (widget_id) REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.admin_roles(id);


--
-- Name: widget_recommendations widget_recommendations_widget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widget_recommendations
    ADD CONSTRAINT widget_recommendations_widget_id_fkey FOREIGN KEY (widget_id) REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE;


--
-- Name: widget_usage_analytics widget_usage_analytics_widget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widget_usage_analytics
    ADD CONSTRAINT widget_usage_analytics_widget_id_fkey FOREIGN KEY (widget_id) REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

