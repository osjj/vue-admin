-- 商品数据填充脚本

-- 清空现有数据（如果需要）
DELETE FROM review_replies;
DELETE FROM product_reviews;
DELETE FROM product_images;
DELETE FROM product_skus;
DELETE FROM product_specifications;
DELETE FROM products;
DELETE FROM brand_category_relations;
DELETE FROM product_brands;
DELETE FROM product_categories;

-- 插入商品分类数据
INSERT INTO product_categories (name, code, description, level, path, sort_order, status, is_featured, seo_title, seo_keywords, seo_description, created_at, updated_at)
VALUES
  ('电子产品', 'electronics', '各类电子设备和配件', 1, '/electronics', 1, true, true, '电子产品 - 高品质电子设备和配件', '电子产品,电子设备,配件', '提供各类高品质电子设备和配件，包括手机、电脑、平板等', NOW(), NOW()),
  ('服装', 'clothing', '时尚服装和配饰', 1, '/clothing', 2, true, true, '服装 - 时尚服装和配饰', '服装,时尚,配饰', '提供各类时尚服装和配饰，包括男装、女装、童装等', NOW(), NOW()),
  ('家居', 'home', '家居用品和装饰品', 1, '/home', 3, true, true, '家居 - 家居用品和装饰品', '家居,用品,装饰品', '提供各类家居用品和装饰品，包括家具、装饰品、厨房用品等', NOW(), NOW()),
  ('运动户外', 'sports', '运动装备和户外用品', 1, '/sports', 4, true, true, '运动户外 - 运动装备和户外用品', '运动,户外,装备', '提供各类运动装备和户外用品，包括健身器材、露营装备等', NOW(), NOW()),
  ('美妆个护', 'beauty', '美妆产品和个人护理用品', 1, '/beauty', 5, true, true, '美妆个护 - 美妆产品和个人护理用品', '美妆,个护,护肤', '提供各类美妆产品和个人护理用品，包括护肤品、彩妆、洗护等', NOW(), NOW());

-- 插入子分类
INSERT INTO product_categories (name, code, description, level, path, sort_order, status, is_featured, parent_id, seo_title, seo_keywords, seo_description, created_at, updated_at)
VALUES
  ('手机', 'mobile', '各类手机和配件', 2, '/electronics/mobile', 1, true, true, (SELECT id FROM product_categories WHERE code = 'electronics' LIMIT 1), '手机 - 各类手机和配件', '手机,智能手机,手机配件', '提供各类手机和配件，包括智能手机、手机壳、充电器等', NOW(), NOW()),
  ('电脑', 'computer', '各类电脑和配件', 2, '/electronics/computer', 2, true, true, (SELECT id FROM product_categories WHERE code = 'electronics' LIMIT 1), '电脑 - 各类电脑和配件', '电脑,笔记本,台式机,配件', '提供各类电脑和配件，包括笔记本、台式机、键盘、鼠标等', NOW(), NOW()),
  ('平板', 'tablet', '各类平板电脑', 2, '/electronics/tablet', 3, true, true, (SELECT id FROM product_categories WHERE code = 'electronics' LIMIT 1), '平板 - 各类平板电脑', '平板,平板电脑,iPad', '提供各类平板电脑，包括iPad、Android平板等', NOW(), NOW()),
  ('男装', 'men', '男士服装', 2, '/clothing/men', 1, true, true, (SELECT id FROM product_categories WHERE code = 'clothing' LIMIT 1), '男装 - 男士服装', '男装,男士,服装', '提供各类男士服装，包括上衣、裤子、外套等', NOW(), NOW()),
  ('女装', 'women', '女士服装', 2, '/clothing/women', 2, true, true, (SELECT id FROM product_categories WHERE code = 'clothing' LIMIT 1), '女装 - 女士服装', '女装,女士,服装', '提供各类女士服装，包括上衣、裤子、裙子等', NOW(), NOW());

-- 插入商品品牌数据
INSERT INTO product_brands (name, logo, description, company, website, sort_order, status, is_featured, country, founded_year, created_at, updated_at)
VALUES
  ('Apple', 'https://placehold.co/200x200?text=Apple', '美国科技公司，生产iPhone、iPad、Mac等产品', 'Apple Inc.', 'https://www.apple.com', 1, true, true, '美国', 1976, NOW(), NOW()),
  ('Samsung', 'https://placehold.co/200x200?text=Samsung', '韩国科技公司，生产Galaxy系列手机、电视等产品', 'Samsung Electronics Co., Ltd.', 'https://www.samsung.com', 2, true, true, '韩国', 1938, NOW(), NOW()),
  ('Nike', 'https://placehold.co/200x200?text=Nike', '美国运动品牌，生产运动鞋、运动服装等产品', 'Nike, Inc.', 'https://www.nike.com', 3, true, true, '美国', 1964, NOW(), NOW()),
  ('IKEA', 'https://placehold.co/200x200?text=IKEA', '瑞典家居品牌，提供各类家具和家居用品', 'IKEA Group', 'https://www.ikea.com', 4, true, true, '瑞典', 1943, NOW(), NOW()),
  ('Xiaomi', 'https://placehold.co/200x200?text=Xiaomi', '中国科技公司，生产智能手机、智能家居等产品', 'Xiaomi Corporation', 'https://www.mi.com', 5, true, true, '中国', 2010, NOW(), NOW()),
  ('Adidas', 'https://placehold.co/200x200?text=Adidas', '德国运动品牌，生产运动鞋、运动服装等产品', 'Adidas AG', 'https://www.adidas.com', 6, true, true, '德国', 1949, NOW(), NOW()),
  ('Huawei', 'https://placehold.co/200x200?text=Huawei', '中国科技公司，生产智能手机、网络设备等产品', 'Huawei Technologies Co., Ltd.', 'https://www.huawei.com', 7, true, true, '中国', 1987, NOW(), NOW()),
  ('Lenovo', 'https://placehold.co/200x200?text=Lenovo', '中国科技公司，生产电脑、手机等产品', 'Lenovo Group Limited', 'https://www.lenovo.com', 8, true, true, '中国', 1984, NOW(), NOW()),
  ('H&M', 'https://placehold.co/200x200?text=H&M', '瑞典服装品牌，提供各类时尚服装', 'H&M Group', 'https://www.hm.com', 9, true, true, '瑞典', 1947, NOW(), NOW()),
  ('Uniqlo', 'https://placehold.co/200x200?text=Uniqlo', '日本服装品牌，提供各类基础服装', 'Fast Retailing Co., Ltd.', 'https://www.uniqlo.com', 10, true, true, '日本', 1949, NOW(), NOW());

-- 插入商品数据
INSERT INTO products (product_code, name, description, price, market_price, cost_price, stock, stock_warning, weight, volume, category_id, brand_id, status, sales, rating, main_image, keywords, tags, sort_order, is_featured, is_new, is_hot, created_at, updated_at)
VALUES
  ('P001', 'iPhone 14 Pro', 'Apple最新旗舰智能手机，搭载A16仿生芯片', 8999.00, 9599.00, 6000.00, 100, 20, 0.2, 0.0001, (SELECT id FROM product_categories WHERE code = 'mobile' LIMIT 1), (SELECT id FROM product_brands WHERE name = 'Apple' LIMIT 1), true, 50, 4.8, 'https://placehold.co/600x400?text=iPhone+14+Pro', 'iPhone,智能手机,Apple', '新品,热销,旗舰', 1, true, true, true, NOW(), NOW()),
  ('P002', 'Samsung Galaxy S23', 'Samsung最新旗舰智能手机，搭载骁龙8 Gen 2处理器', 7999.00, 8599.00, 5000.00, 80, 15, 0.18, 0.0001, (SELECT id FROM product_categories WHERE code = 'mobile' LIMIT 1), (SELECT id FROM product_brands WHERE name = 'Samsung' LIMIT 1), true, 40, 4.7, 'https://placehold.co/600x400?text=Samsung+Galaxy+S23', 'Samsung,智能手机,Galaxy', '新品,热销,旗舰', 2, true, true, true, NOW(), NOW()),
  ('P003', 'MacBook Pro 14', 'Apple最新专业笔记本电脑，搭载M2 Pro芯片', 14999.00, 15999.00, 10000.00, 50, 10, 1.6, 0.002, (SELECT id FROM product_categories WHERE code = 'computer' LIMIT 1), (SELECT id FROM product_brands WHERE name = 'Apple' LIMIT 1), true, 30, 4.9, 'https://placehold.co/600x400?text=MacBook+Pro+14', 'MacBook,笔记本电脑,Apple', '新品,热销,专业', 3, true, true, false, NOW(), NOW()),
  ('P004', 'Nike Air Max 270', 'Nike经典跑鞋，搭载Air Max气垫', 1299.00, 1499.00, 600.00, 200, 30, 0.3, 0.005, (SELECT id FROM product_categories WHERE code = 'men' LIMIT 1), (SELECT id FROM product_brands WHERE name = 'Nike' LIMIT 1), true, 100, 4.6, 'https://placehold.co/600x400?text=Nike+Air+Max+270', 'Nike,跑鞋,运动鞋', '经典,热销,舒适', 4, true, false, true, NOW(), NOW()),
  ('P005', 'IKEA BILLY 书柜', 'IKEA经典书柜，简约实用', 599.00, 699.00, 300.00, 150, 20, 30.0, 0.2, (SELECT id FROM product_categories WHERE code = 'home' LIMIT 1), (SELECT id FROM product_brands WHERE name = 'IKEA' LIMIT 1), true, 80, 4.5, 'https://placehold.co/600x400?text=IKEA+BILLY', 'IKEA,书柜,家具', '经典,实用,简约', 5, true, false, false, NOW(), NOW()),
  ('P006', 'Xiaomi 13', 'Xiaomi最新旗舰智能手机，搭载骁龙8 Gen 2处理器', 4999.00, 5299.00, 3000.00, 120, 25, 0.19, 0.0001, (SELECT id FROM product_categories WHERE code = 'mobile' LIMIT 1), (SELECT id FROM product_brands WHERE name = 'Xiaomi' LIMIT 1), true, 60, 4.6, 'https://placehold.co/600x400?text=Xiaomi+13', 'Xiaomi,智能手机,小米', '新品,热销,旗舰', 6, true, true, true, NOW(), NOW());

-- 插入商品图片数据
INSERT INTO product_images (product_id, image_url, alt, sort_order, is_main, created_at, updated_at)
VALUES
  ((SELECT id FROM products WHERE product_code = 'P001' LIMIT 1), 'https://placehold.co/600x400?text=iPhone+14+Pro+1', 'iPhone 14 Pro 正面图', 1, true, NOW(), NOW()),
  ((SELECT id FROM products WHERE product_code = 'P001' LIMIT 1), 'https://placehold.co/600x400?text=iPhone+14+Pro+2', 'iPhone 14 Pro 背面图', 2, false, NOW(), NOW()),
  ((SELECT id FROM products WHERE product_code = 'P002' LIMIT 1), 'https://placehold.co/600x400?text=Samsung+Galaxy+S23+1', 'Samsung Galaxy S23 正面图', 1, true, NOW(), NOW()),
  ((SELECT id FROM products WHERE product_code = 'P002' LIMIT 1), 'https://placehold.co/600x400?text=Samsung+Galaxy+S23+2', 'Samsung Galaxy S23 背面图', 2, false, NOW(), NOW());

-- 插入商品规格数据
INSERT INTO product_specifications (product_id, spec_name, spec_value, sort_order, created_at, updated_at)
VALUES
  ((SELECT id FROM products WHERE product_code = 'P001' LIMIT 1), '屏幕尺寸', '6.1英寸', 1, NOW(), NOW()),
  ((SELECT id FROM products WHERE product_code = 'P001' LIMIT 1), '存储容量', '256GB', 2, NOW(), NOW()),
  ((SELECT id FROM products WHERE product_code = 'P001' LIMIT 1), '处理器', 'A16仿生芯片', 3, NOW(), NOW()),
  ((SELECT id FROM products WHERE product_code = 'P002' LIMIT 1), '屏幕尺寸', '6.2英寸', 1, NOW(), NOW()),
  ((SELECT id FROM products WHERE product_code = 'P002' LIMIT 1), '存储容量', '256GB', 2, NOW(), NOW()),
  ((SELECT id FROM products WHERE product_code = 'P002' LIMIT 1), '处理器', '骁龙8 Gen 2', 3, NOW(), NOW());

-- 插入商品SKU数据
INSERT INTO product_skus (product_id, sku_code, spec_info, price, stock, status, created_at, updated_at)
VALUES
  ((SELECT id FROM products WHERE product_code = 'P001' LIMIT 1), 'SKU001', '黑色,256GB', 8999.00, 50, true, NOW(), NOW()),
  ((SELECT id FROM products WHERE product_code = 'P001' LIMIT 1), 'SKU002', '白色,256GB', 8999.00, 50, true, NOW(), NOW()),
  ((SELECT id FROM products WHERE product_code = 'P002' LIMIT 1), 'SKU003', '黑色,256GB', 7999.00, 40, true, NOW(), NOW()),
  ((SELECT id FROM products WHERE product_code = 'P002' LIMIT 1), 'SKU004', '白色,256GB', 7999.00, 40, true, NOW(), NOW());

-- 创建测试用户（如果不存在）
DO $$
DECLARE
  user_exists BOOLEAN;
  admin_user_id UUID;
  customer_user_id UUID;
  review_id1 BIGINT;
  review_id2 BIGINT;
  review_id3 BIGINT;
  product_id1 BIGINT;
  product_id2 BIGINT;
  product_id3 BIGINT;
BEGIN
  -- 检查是否存在测试用户
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@example.com') INTO user_exists;
  
  -- 如果不存在，尝试创建测试用户
  IF NOT user_exists THEN
    BEGIN
      -- 创建管理员用户
      INSERT INTO auth.users (
        instance_id,
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'admin@example.com',
        crypt('admin123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW()
      ) RETURNING id INTO admin_user_id;
      
      -- 创建客户用户
      INSERT INTO auth.users (
        instance_id,
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'customer@example.com',
        crypt('customer123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW()
      ) RETURNING id INTO customer_user_id;
    EXCEPTION
      WHEN OTHERS THEN
        -- 如果创建用户失败，使用固定的UUID
        admin_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
        customer_user_id := '00000000-0000-0000-0000-000000000002'::UUID;
    END;
  ELSE
    -- 获取现有用户ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@example.com';
    SELECT id INTO customer_user_id FROM auth.users WHERE email = 'customer@example.com';
    
    -- 如果没有找到客户用户，使用管理员用户ID
    IF customer_user_id IS NULL THEN
      customer_user_id := admin_user_id;
    END IF;
  END IF;

  -- 如果仍然没有用户ID，使用固定的UUID
  IF admin_user_id IS NULL THEN
    admin_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
  END IF;
  
  IF customer_user_id IS NULL THEN
    customer_user_id := '00000000-0000-0000-0000-000000000002'::UUID;
  END IF;

  -- 获取产品ID
  SELECT id INTO product_id1 FROM products WHERE product_code = 'P001' LIMIT 1;
  SELECT id INTO product_id2 FROM products WHERE product_code = 'P002' LIMIT 1;
  SELECT id INTO product_id3 FROM products WHERE product_code = 'P003' LIMIT 1;

  -- 插入商品评论数据
  INSERT INTO product_reviews (product_id, user_id, rating, content, images, status, is_anonymous, likes, created_at, updated_at)
  VALUES
    (product_id1, admin_user_id, 5, '非常好用的手机，拍照效果很棒，续航也不错。', 'https://placehold.co/300x300?text=Review+1', 1, false, 10, NOW(), NOW())
  RETURNING id INTO review_id1;
  
  INSERT INTO product_reviews (product_id, user_id, rating, content, status, is_anonymous, likes, created_at, updated_at)
  VALUES
    (product_id1, customer_user_id, 4, '整体不错，就是价格有点贵。', 1, true, 5, NOW(), NOW())
  RETURNING id INTO review_id2;
  
  INSERT INTO product_reviews (product_id, user_id, rating, content, images, status, is_anonymous, likes, created_at, updated_at)
  VALUES
    (product_id2, admin_user_id, 5, '很棒的手机，系统流畅，拍照效果好。', 'https://placehold.co/300x300?text=Review+3', 1, false, 8, NOW(), NOW())
  RETURNING id INTO review_id3;
  
  INSERT INTO product_reviews (product_id, user_id, rating, content, status, is_anonymous, likes, created_at, updated_at)
  VALUES
    (product_id3, customer_user_id, 5, '性能强大，散热好，屏幕显示效果出色。', 0, false, 0, NOW(), NOW());
  
  -- 插入更多评论
  INSERT INTO product_reviews (product_id, user_id, rating, content, status, is_anonymous, likes, created_at, updated_at)
  VALUES
    (product_id1, admin_user_id, 3, '手机还可以，但是电池续航一般。', 1, false, 2, NOW(), NOW()),
    (product_id2, customer_user_id, 4, '系统流畅，但相机效果一般。', 1, true, 3, NOW(), NOW()),
    (product_id3, admin_user_id, 4, '性能不错，但价格有点贵。', 1, false, 1, NOW(), NOW()),
    (product_id1, customer_user_id, 5, '非常满意，各方面都很好。', 1, false, 7, NOW(), NOW()),
    (product_id2, admin_user_id, 2, '屏幕有点问题，其他还可以。', 1, true, 0, NOW(), NOW()),
    (product_id3, customer_user_id, 5, '完美的产品，没有任何缺点。', 1, false, 15, NOW(), NOW());
  
  -- 插入评论回复
  INSERT INTO review_replies (review_id, user_id, content, is_admin, status, created_at, updated_at)
  VALUES
    (review_id1, admin_user_id, '感谢您的评价，我们会继续努力提供更好的产品。', true, true, NOW(), NOW()),
    (review_id2, admin_user_id, '谢谢您的支持，我们会考虑您对价格的反馈。', true, true, NOW(), NOW()),
    (review_id3, admin_user_id, '感谢您的好评，欢迎再次购买我们的产品。', true, true, NOW(), NOW());
  
  -- 插入更多评论回复
  INSERT INTO review_replies (review_id, user_id, content, is_admin, status, created_at, updated_at)
  VALUES
    (review_id1, customer_user_id, '这款手机确实很好用！', false, true, NOW(), NOW()),
    (review_id2, customer_user_id, '我也觉得价格有点贵。', false, true, NOW(), NOW()),
    (review_id3, customer_user_id, '我也买了这款手机，很满意。', false, true, NOW(), NOW());
END $$;
