-- 商品管理模块数据库表结构 (PostgreSQL/Supabase版本)

-- 商品分类表
CREATE TABLE IF NOT EXISTS product_categories (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT REFERENCES product_categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(50),
  icon VARCHAR(255),
  description VARCHAR(255),
  level SMALLINT NOT NULL DEFAULT 1,
  path VARCHAR(255),
  sort_order INT DEFAULT 0,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  seo_title VARCHAR(100),
  seo_keywords VARCHAR(255),
  seo_description VARCHAR(255),
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  ext_field1 VARCHAR(255),
  ext_field2 VARCHAR(255)
);
COMMENT ON TABLE product_categories IS '商品分类表';
CREATE INDEX idx_category_parent_id ON product_categories(parent_id);
CREATE INDEX idx_category_level ON product_categories(level);
CREATE INDEX idx_category_sort_order ON product_categories(sort_order);
CREATE INDEX idx_category_deleted_at ON product_categories(deleted_at);

-- 商品品牌表
CREATE TABLE IF NOT EXISTS product_brands (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  logo VARCHAR(255),
  description TEXT,
  company VARCHAR(100),
  website VARCHAR(100),
  sort_order INT DEFAULT 0,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  country VARCHAR(50),
  founded_year INT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  ext_field1 VARCHAR(255),
  ext_field2 VARCHAR(255)
);
COMMENT ON TABLE product_brands IS '商品品牌表';
CREATE INDEX idx_brand_sort_order ON product_brands(sort_order);
CREATE INDEX idx_brand_status ON product_brands(status);
CREATE INDEX idx_brand_deleted_at ON product_brands(deleted_at);

-- 品牌分类关联表
CREATE TABLE IF NOT EXISTS brand_category_relations (
  id BIGSERIAL PRIMARY KEY,
  brand_id BIGINT NOT NULL REFERENCES product_brands(id) ON DELETE CASCADE ON UPDATE CASCADE,
  category_id BIGINT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_id, category_id)
);
COMMENT ON TABLE brand_category_relations IS '品牌分类关联表';
CREATE INDEX idx_relation_category_id ON brand_category_relations(category_id);

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  product_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  market_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  stock INT NOT NULL DEFAULT 0,
  stock_warning INT DEFAULT 10,
  weight DECIMAL(10,2),
  volume DECIMAL(10,2),
  category_id BIGINT NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  brand_id BIGINT REFERENCES product_brands(id) ON DELETE SET NULL ON UPDATE CASCADE,
  status BOOLEAN NOT NULL DEFAULT FALSE,
  sales INT NOT NULL DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 5.0,
  main_image VARCHAR(255),
  video_url VARCHAR(255),
  keywords VARCHAR(255),
  tags VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_hot BOOLEAN DEFAULT FALSE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  ext_field1 VARCHAR(255),
  ext_field2 VARCHAR(255),
  ext_json JSONB
);
COMMENT ON TABLE products IS '商品表';
CREATE INDEX idx_product_category_id ON products(category_id);
CREATE INDEX idx_product_brand_id ON products(brand_id);
CREATE INDEX idx_product_status ON products(status);
CREATE INDEX idx_product_created_at ON products(created_at);
CREATE INDEX idx_product_deleted_at ON products(deleted_at);

-- 商品图片表
CREATE TABLE IF NOT EXISTS product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  image_url VARCHAR(255) NOT NULL,
  alt VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_main BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE product_images IS '商品图片表';
CREATE INDEX idx_image_product_id ON product_images(product_id);

-- 商品规格表
CREATE TABLE IF NOT EXISTS product_specifications (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  spec_name VARCHAR(50) NOT NULL,
  spec_value VARCHAR(50) NOT NULL,
  spec_image VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE product_specifications IS '商品规格表';
CREATE INDEX idx_spec_product_id ON product_specifications(product_id);

-- 商品SKU表
CREATE TABLE IF NOT EXISTS product_skus (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  sku_code VARCHAR(50) NOT NULL UNIQUE,
  spec_info VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255),
  barcode VARCHAR(50),
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE product_skus IS '商品SKU表';
CREATE INDEX idx_sku_product_id ON product_skus(product_id);

-- 商品评论表
CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id UUID NOT NULL,
  order_id BIGINT,
  rating SMALLINT NOT NULL DEFAULT 5,
  content TEXT NOT NULL,
  images VARCHAR(1000),
  status SMALLINT NOT NULL DEFAULT 0,
  is_anonymous BOOLEAN DEFAULT FALSE,
  likes INT DEFAULT 0,
  parent_id BIGINT REFERENCES product_reviews(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ip_address VARCHAR(50),
  user_agent VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
COMMENT ON TABLE product_reviews IS '商品评论表';
CREATE INDEX idx_review_product_id ON product_reviews(product_id);
CREATE INDEX idx_review_user_id ON product_reviews(user_id);
CREATE INDEX idx_review_status ON product_reviews(status);
CREATE INDEX idx_review_parent_id ON product_reviews(parent_id);
CREATE INDEX idx_review_deleted_at ON product_reviews(deleted_at);

-- 评论回复表
CREATE TABLE IF NOT EXISTS review_replies (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE ON UPDATE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
COMMENT ON TABLE review_replies IS '评论回复表';
CREATE INDEX idx_reply_review_id ON review_replies(review_id);
CREATE INDEX idx_reply_user_id ON review_replies(user_id);
CREATE INDEX idx_reply_deleted_at ON review_replies(deleted_at);

-- 敏感词表
CREATE TABLE IF NOT EXISTS sensitive_words (
  id BIGSERIAL PRIMARY KEY,
  word VARCHAR(50) NOT NULL UNIQUE,
  replacement VARCHAR(50) DEFAULT '***',
  level SMALLINT DEFAULT 1,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE sensitive_words IS '敏感词表';
CREATE INDEX idx_word_level ON sensitive_words(level);
CREATE INDEX idx_word_status ON sensitive_words(status);

-- 商品属性表
CREATE TABLE IF NOT EXISTS product_attributes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  category_id BIGINT REFERENCES product_categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
  input_type VARCHAR(20) NOT NULL DEFAULT 'text',
  values TEXT,
  unit VARCHAR(20),
  is_required BOOLEAN DEFAULT FALSE,
  is_filter BOOLEAN DEFAULT FALSE,
  is_search BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE product_attributes IS '商品属性表';
CREATE INDEX idx_attribute_category_id ON product_attributes(category_id);
CREATE INDEX idx_attribute_sort_order ON product_attributes(sort_order);

-- 商品属性值表
CREATE TABLE IF NOT EXISTS product_attribute_values (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  attribute_id BIGINT NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE product_attribute_values IS '商品属性值表';
CREATE INDEX idx_value_product_id ON product_attribute_values(product_id);
CREATE INDEX idx_value_attribute_id ON product_attribute_values(attribute_id);

-- 创建行级安全策略
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_category_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitive_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;

-- 创建基本的安全策略 (示例)
CREATE POLICY "允许认证用户读取商品" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "只允许管理员创建和修改商品" ON products
  FOR ALL USING (auth.role() = 'service_role');

-- 创建自动更新updated_at的触发器函数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加自动更新时间戳的触发器
CREATE TRIGGER update_product_timestamp BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_category_timestamp BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_brand_timestamp BEFORE UPDATE ON product_brands
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_sku_timestamp BEFORE UPDATE ON product_skus
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_review_timestamp BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_reply_timestamp BEFORE UPDATE ON review_replies
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_attribute_timestamp BEFORE UPDATE ON product_attributes
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_attribute_value_timestamp BEFORE UPDATE ON product_attribute_values
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();