-- Nsambya Canteen POS Database Schema
-- PostgreSQL 14+ compatible
-- Generated from Rails migrations

-- ============================================
-- Users & Sessions
-- ============================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email_address VARCHAR NOT NULL,
    password_digest VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    worker_id VARCHAR NOT NULL,
    role INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE UNIQUE INDEX index_users_on_email_address ON users (email_address);
CREATE UNIQUE INDEX index_users_on_worker_id ON users (worker_id);

CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    ip_address VARCHAR,
    user_agent VARCHAR,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

-- ============================================
-- Menu
-- ============================================

CREATE TABLE menu_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE UNIQUE INDEX index_menu_categories_on_name ON menu_categories (name);

CREATE TABLE menu_items (
    id BIGSERIAL PRIMARY KEY,
    menu_category_id BIGINT NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
    name VARCHAR NOT NULL,
    description TEXT,
    current_price NUMERIC(12,0) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX index_menu_items_on_menu_category_id_and_active ON menu_items (menu_category_id, active);

-- ============================================
-- Orders & Items
-- ============================================

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR NOT NULL,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    worker_name_snapshot VARCHAR NOT NULL,
    worker_id_snapshot VARCHAR NOT NULL,
    customer_name VARCHAR,
    customer_reference VARCHAR,
    ward VARCHAR,
    bed_number VARCHAR,
    notes VARCHAR,
    subtotal NUMERIC(12,0) NOT NULL,
    total NUMERIC(12,0) NOT NULL,
    status INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE UNIQUE INDEX index_orders_on_order_number ON orders (order_number);
CREATE INDEX index_orders_on_created_by_user_id_and_created_at ON orders (created_by_user_id, created_at);
CREATE INDEX index_orders_on_status_and_completed_at ON orders (status, completed_at);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    item_name_snapshot VARCHAR NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_snapshot NUMERIC(12,0) NOT NULL,
    line_total NUMERIC(12,0) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT order_items_unit_price_positive CHECK (unit_price_snapshot > 0)
);

-- ============================================
-- Payments
-- ============================================

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    recorded_by_user_id BIGINT NOT NULL REFERENCES users(id),
    verified_by_user_id BIGINT REFERENCES users(id),
    payment_method INTEGER NOT NULL,
    status INTEGER NOT NULL DEFAULT 0,
    amount NUMERIC(12,0) NOT NULL,
    amount_received NUMERIC(12,0) NOT NULL,
    change_due NUMERIC(12,0) NOT NULL DEFAULT 0,
    external_reference VARCHAR,
    idempotency_key VARCHAR NOT NULL,
    paid_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE UNIQUE INDEX index_payments_on_order_id ON payments (order_id);
CREATE UNIQUE INDEX index_payments_on_idempotency_key ON payments (idempotency_key);
CREATE INDEX index_payments_on_payment_method_and_status_and_paid_at ON payments (payment_method, status, paid_at);

-- ============================================
-- Receipts
-- ============================================

CREATE TABLE receipts (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    receipt_number VARCHAR NOT NULL,
    generated_at TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE UNIQUE INDEX index_receipts_on_order_id ON receipts (order_id);
CREATE UNIQUE INDEX index_receipts_on_receipt_number ON receipts (receipt_number);

-- ============================================
-- Audit Logs
-- ============================================

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR NOT NULL,
    record_type VARCHAR NOT NULL,
    record_id VARCHAR,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX index_audit_logs_on_record_type_and_record_id ON audit_logs (record_type, record_id);
CREATE INDEX index_audit_logs_on_action_and_created_at ON audit_logs (action, created_at);

-- ============================================
-- Sale Corrections & Cash Closings
-- ============================================

CREATE TABLE sale_corrections (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    corrected_by_user_id BIGINT NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE TABLE cash_closings (
    id BIGSERIAL PRIMARY KEY,
    closing_date DATE NOT NULL,
    closed_by_user_id BIGINT NOT NULL REFERENCES users(id),
    total_sales NUMERIC(12,0) NOT NULL DEFAULT 0,
    total_cash NUMERIC(12,0) NOT NULL DEFAULT 0,
    total_mobile_money NUMERIC(12,0) NOT NULL DEFAULT 0,
    total_other NUMERIC(12,0) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

-- ============================================
-- Password Reset Tokens
-- ============================================

CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    token VARCHAR NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX index_password_reset_tokens_on_token ON password_reset_tokens (token);
CREATE INDEX index_password_reset_tokens_on_user_id ON password_reset_tokens (user_id);

CREATE TABLE password_reset_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    token VARCHAR NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX index_password_reset_requests_on_token ON password_reset_requests (token);
CREATE INDEX index_password_reset_requests_on_user_id ON password_reset_requests (user_id);

-- ============================================
-- Active Storage (Rails file uploads)
-- ============================================

CREATE TABLE active_storage_blobs (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR NOT NULL,
    filename VARCHAR NOT NULL,
    content_type VARCHAR,
    metadata TEXT,
    service_name VARCHAR NOT NULL,
    byte_size BIGINT NOT NULL,
    checksum VARCHAR,
    created_at TIMESTAMP(6) NOT NULL
);

CREATE UNIQUE INDEX index_active_storage_blobs_on_key ON active_storage_blobs (key);

CREATE TABLE active_storage_attachments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    record_type VARCHAR NOT NULL,
    record_id BIGINT NOT NULL,
    blob_id BIGINT NOT NULL REFERENCES active_storage_blobs(id),
    created_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX index_active_storage_attachments_on_record_type_and_record_id ON active_storage_attachments (record_type, record_id);
CREATE INDEX index_active_storage_attachments_on_blob_id ON active_storage_attachments (blob_id);

CREATE TABLE active_storage_variant_records (
    id BIGSERIAL PRIMARY KEY,
    blob_id BIGINT NOT NULL REFERENCES active_storage_blobs(id),
    variation_digest VARCHAR NOT NULL,
    created_at TIMESTAMP(6) NOT NULL
);

CREATE UNIQUE INDEX index_active_storage_variant_records_on_blob_id_and_variation_digest ON active_storage_variant_records (blob_id, variation_digest);

-- ============================================
-- Seed Data
-- ============================================

-- Sample users (password: SuperAdmin123!)
-- INSERT INTO users (email_address, password_digest, full_name, worker_id, role, active, created_at, updated_at)
-- VALUES ('admin@nsambya.com', '$2a$12$...', 'John Doe', 'W001', 2, true, NOW(), NOW());

-- Sample menu categories
INSERT INTO menu_categories (name, description, active, created_at, updated_at) VALUES
    ('Burgers', 'Burgers and sandwiches', true, NOW(), NOW()),
    ('Chicken', 'Chicken dishes', true, NOW(), NOW()),
    ('Chapati & Rice', 'Chapati and rice meals', true, NOW(), NOW()),
    ('Drinks', 'Beverages', true, NOW(), NOW()),
    ('Snacks', 'Light snacks and bites', true, NOW(), NOW());
