-- 创建product_skus表
CREATE TABLE IF NOT EXISTS product_skus (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    sku_code VARCHAR(50) NOT NULL,
    spec_info TEXT,
    price NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    image_url VARCHAR(255),
    barcode VARCHAR(50),
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, sku_code)
);

-- 为product_skus表添加索引
CREATE INDEX IF NOT EXISTS idx_product_skus_product_id ON product_skus(product_id);
CREATE INDEX IF NOT EXISTS idx_product_skus_sku_code ON product_skus(sku_code);

-- 修改inventory表，添加sku_id字段
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS sku_id BIGINT REFERENCES product_skus(id);

-- 创建inventory_view视图，包含SKU信息
CREATE OR REPLACE VIEW inventory_view AS
SELECT 
    i.id,
    i.warehouse_id,
    i.product_id,
    i.sku_id,
    i.quantity,
    i.locked_quantity,
    i.created_at,
    i.updated_at,
    p.name AS product_name,
    p.product_code,
    p.main_image AS product_image,
    ps.sku_code,
    ps.spec_info,
    w.name AS warehouse_name
FROM 
    inventory i
JOIN 
    products p ON i.product_id = p.id
LEFT JOIN 
    product_skus ps ON i.sku_id = ps.id
LEFT JOIN 
    warehouses w ON i.warehouse_id = w.id
WHERE 
    p.deleted_at IS NULL;
