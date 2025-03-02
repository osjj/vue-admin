-- 创建exec_sql函数
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$;

-- 创建product_skus表
CREATE TABLE IF NOT EXISTS product_skus (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    sku_code VARCHAR(50) NOT NULL,
    spec_info TEXT,
    price NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    stock_warning INTEGER DEFAULT 10,
    image_url VARCHAR(255),
    barcode VARCHAR(50),
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, sku_code)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_product_skus_product_id ON product_skus(product_id);
CREATE INDEX IF NOT EXISTS idx_product_skus_sku_code ON product_skus(sku_code);

-- 如果表已存在但缺少stock_warning字段，添加该字段
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'product_skus'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'product_skus' AND column_name = 'stock_warning'
    ) THEN
        ALTER TABLE product_skus ADD COLUMN stock_warning INTEGER DEFAULT 10;
    END IF;
END $$; 