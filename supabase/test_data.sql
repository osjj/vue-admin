-- 测试数据生成脚本
-- 注意：执行前请确保已创建相关表结构和RLS策略
-- 重要：请将下面的用户ID '00000000-0000-0000-0000-000000000001' 替换为您系统中实际存在的用户ID

-- 清空现有测试数据（如果需要）
-- DELETE FROM inventory_logs;
-- DELETE FROM inventory;
-- DELETE FROM order_items;
-- DELETE FROM orders;
-- DELETE FROM product_skus;
-- DELETE FROM products;
-- DELETE FROM product_brands;
-- DELETE FROM product_categories;
-- DELETE FROM warehouses;

-- 插入产品分类数据
INSERT INTO product_categories (id, parent_id, name, code, level, status, sort_order)
VALUES
  (1, NULL, '手机', 'phone', 1, true, 1),
  (2, NULL, '电脑', 'computer', 1, true, 2),
  (3, 2, '笔记本电脑', 'laptop', 2, true, 1),
  (4, 2, '台式电脑', 'desktop', 2, true, 2);

-- 重置序列值
SELECT setval('product_categories_id_seq', 4);

-- 插入产品品牌数据
INSERT INTO product_brands (id, name, logo, description, status, sort_order)
VALUES
  (1, '苹果', 'https://example.com/apple.png', '美国科技公司', true, 1),
  (2, '华为', 'https://example.com/huawei.png', '中国科技公司', true, 2),
  (3, '小米', 'https://example.com/xiaomi.png', '中国科技公司', true, 3),
  (4, '联想', 'https://example.com/lenovo.png', '中国科技公司', true, 4);

-- 重置序列值
SELECT setval('product_brands_id_seq', 4);

-- 插入仓库数据
INSERT INTO warehouses (id, name, address, is_default, status, created_at, updated_at)
VALUES
  (1, '北京总仓', '北京市朝阳区建国路88号', true, true, NOW() - INTERVAL '30 days', NOW()),
  (2, '上海仓库', '上海市浦东新区张江高科技园区', false, true, NOW() - INTERVAL '25 days', NOW()),
  (3, '广州仓库', '广州市天河区珠江新城', false, true, NOW() - INTERVAL '20 days', NOW()),
  (4, '深圳仓库', '深圳市南山区科技园', false, false, NOW() - INTERVAL '15 days', NOW());

-- 重置序列值
SELECT setval('warehouses_id_seq', 4);

-- 使用DO块来处理产品和SKU的插入，确保ID的一致性
DO $$
DECLARE
  iphone_id BIGINT;
  macbook_id BIGINT;
  huawei_id BIGINT;
  xiaomi_id BIGINT;
  thinkpad_id BIGINT;
  sku_id_1 BIGINT;
  sku_id_2 BIGINT;
  sku_id_3 BIGINT;
  sku_id_4 BIGINT;
  sku_id_5 BIGINT;
  sku_id_6 BIGINT;
  sku_id_7 BIGINT;
  sku_id_8 BIGINT;
  order_id_1 BIGINT;
  order_id_2 BIGINT;
  order_id_3 BIGINT;
  order_id_4 BIGINT;
  order_id_5 BIGINT;
  order_id_6 BIGINT;
  order_id_7 BIGINT;
  order_id_8 BIGINT;
  order_id_9 BIGINT;
  order_id_10 BIGINT;
  test_user_id UUID := '7758674e-c784-4b6b-9da0-a887e7325f47'; -- 请替换为实际存在的用户ID
BEGIN

-- 插入产品数据并获取ID
INSERT INTO products (product_code, name, description, price, main_image, category_id, brand_id, status, created_at, updated_at)
VALUES
  ('IP13', 'iPhone 13', '苹果iPhone 13智能手机', 5999.00, 'https://example.com/iphone13.jpg', 1, 1, true, NOW() - INTERVAL '60 days', NOW())
RETURNING id INTO iphone_id;

INSERT INTO products (product_code, name, description, price, main_image, category_id, brand_id, status, created_at, updated_at)
VALUES
  ('MBP', 'MacBook Pro', '苹果MacBook Pro笔记本电脑', 12999.00, 'https://example.com/macbookpro.jpg', 3, 1, true, NOW() - INTERVAL '55 days', NOW())
RETURNING id INTO macbook_id;

INSERT INTO products (product_code, name, description, price, main_image, category_id, brand_id, status, created_at, updated_at)
VALUES
  ('HW-M40P', '华为Mate 40 Pro', '华为Mate 40 Pro智能手机', 6999.00, 'https://example.com/mate40pro.jpg', 1, 2, true, NOW() - INTERVAL '50 days', NOW())
RETURNING id INTO huawei_id;

INSERT INTO products (product_code, name, description, price, main_image, category_id, brand_id, status, created_at, updated_at)
VALUES
  ('MI11', '小米11', '小米11智能手机', 3999.00, 'https://example.com/mi11.jpg', 1, 3, true, NOW() - INTERVAL '45 days', NOW())
RETURNING id INTO xiaomi_id;

INSERT INTO products (product_code, name, description, price, main_image, category_id, brand_id, status, created_at, updated_at)
VALUES
  ('TP-X1', '联想ThinkPad X1', '联想ThinkPad X1笔记本电脑', 9999.00, 'https://example.com/thinkpadx1.jpg', 3, 4, true, NOW() - INTERVAL '40 days', NOW())
RETURNING id INTO thinkpad_id;

-- 插入产品SKU并获取ID
INSERT INTO product_skus (product_id, sku_code, spec_info, price, stock, status, created_at, updated_at)
VALUES
  (iphone_id, 'IP13-128-BLACK', '黑色, 128GB', 5999.00, 100, true, NOW() - INTERVAL '60 days', NOW())
RETURNING id INTO sku_id_1;

INSERT INTO product_skus (product_id, sku_code, spec_info, price, stock, status, created_at, updated_at)
VALUES
  (iphone_id, 'IP13-128-WHITE', '白色, 128GB', 5999.00, 80, true, NOW() - INTERVAL '60 days', NOW())
RETURNING id INTO sku_id_2;

INSERT INTO product_skus (product_id, sku_code, spec_info, price, stock, status, created_at, updated_at)
VALUES
  (iphone_id, 'IP13-256-BLACK', '黑色, 256GB', 6799.00, 50, true, NOW() - INTERVAL '60 days', NOW())
RETURNING id INTO sku_id_3;

INSERT INTO product_skus (product_id, sku_code, spec_info, price, stock, status, created_at, updated_at)
VALUES
  (macbook_id, 'MBP-8-256-SILVER', '银色, 8GB, 256GB', 12999.00, 30, true, NOW() - INTERVAL '55 days', NOW())
RETURNING id INTO sku_id_4;

INSERT INTO product_skus (product_id, sku_code, spec_info, price, stock, status, created_at, updated_at)
VALUES
  (macbook_id, 'MBP-16-512-SILVER', '银色, 16GB, 512GB', 15999.00, 20, true, NOW() - INTERVAL '55 days', NOW())
RETURNING id INTO sku_id_5;

INSERT INTO product_skus (product_id, sku_code, spec_info, price, stock, status, created_at, updated_at)
VALUES
  (huawei_id, 'HW-M40P-256-BLACK', '黑色, 256GB', 6999.00, 60, true, NOW() - INTERVAL '50 days', NOW())
RETURNING id INTO sku_id_6;

INSERT INTO product_skus (product_id, sku_code, spec_info, price, stock, status, created_at, updated_at)
VALUES
  (xiaomi_id, 'MI11-128-BLUE', '蓝色, 128GB', 3999.00, 100, true, NOW() - INTERVAL '45 days', NOW())
RETURNING id INTO sku_id_7;

INSERT INTO product_skus (product_id, sku_code, spec_info, price, stock, status, created_at, updated_at)
VALUES
  (thinkpad_id, 'TP-X1-16-512-BLACK', '黑色, 16GB, 512GB', 9999.00, 15, true, NOW() - INTERVAL '40 days', NOW())
RETURNING id INTO sku_id_8;

-- 插入库存数据
INSERT INTO inventory (warehouse_id, product_id, sku_id, quantity, locked_quantity, created_at, updated_at)
VALUES
  -- 北京总仓
  (1, iphone_id, sku_id_1, 50, 5, NOW() - INTERVAL '30 days', NOW()),
  (1, iphone_id, sku_id_2, 40, 3, NOW() - INTERVAL '30 days', NOW()),
  (1, iphone_id, sku_id_3, 25, 2, NOW() - INTERVAL '30 days', NOW()),
  (1, macbook_id, sku_id_4, 15, 1, NOW() - INTERVAL '30 days', NOW()),
  (1, macbook_id, sku_id_5, 10, 1, NOW() - INTERVAL '30 days', NOW()),
  (1, huawei_id, sku_id_6, 30, 2, NOW() - INTERVAL '30 days', NOW()),
  (1, xiaomi_id, sku_id_7, 50, 5, NOW() - INTERVAL '30 days', NOW()),
  (1, thinkpad_id, sku_id_8, 8, 1, NOW() - INTERVAL '30 days', NOW()),
  
  -- 上海仓库
  (2, iphone_id, sku_id_1, 30, 3, NOW() - INTERVAL '25 days', NOW()),
  (2, iphone_id, sku_id_2, 20, 2, NOW() - INTERVAL '25 days', NOW()),
  (2, iphone_id, sku_id_3, 15, 1, NOW() - INTERVAL '25 days', NOW()),
  (2, macbook_id, sku_id_4, 10, 1, NOW() - INTERVAL '25 days', NOW()),
  (2, macbook_id, sku_id_5, 5, 0, NOW() - INTERVAL '25 days', NOW()),
  (2, huawei_id, sku_id_6, 20, 2, NOW() - INTERVAL '25 days', NOW()),
  (2, xiaomi_id, sku_id_7, 30, 3, NOW() - INTERVAL '25 days', NOW()),
  (2, thinkpad_id, sku_id_8, 4, 0, NOW() - INTERVAL '25 days', NOW()),
  
  -- 广州仓库
  (3, iphone_id, sku_id_1, 20, 2, NOW() - INTERVAL '20 days', NOW()),
  (3, iphone_id, sku_id_2, 20, 2, NOW() - INTERVAL '20 days', NOW()),
  (3, iphone_id, sku_id_3, 10, 1, NOW() - INTERVAL '20 days', NOW()),
  (3, macbook_id, sku_id_4, 5, 0, NOW() - INTERVAL '20 days', NOW()),
  (3, macbook_id, sku_id_5, 5, 0, NOW() - INTERVAL '20 days', NOW()),
  (3, huawei_id, sku_id_6, 10, 1, NOW() - INTERVAL '20 days', NOW()),
  (3, xiaomi_id, sku_id_7, 20, 2, NOW() - INTERVAL '20 days', NOW()),
  (3, thinkpad_id, sku_id_8, 3, 0, NOW() - INTERVAL '20 days', NOW());

-- 插入订单数据
INSERT INTO orders (order_no, user_id, status, total_amount, payment_method, payment_time, shipping_fee, 
                   recipient_name, recipient_phone, recipient_address, tracking_number, shipping_time, 
                   completion_time, buyer_note, created_at, updated_at)
VALUES
  -- 待支付订单
  ('ORD202502250001', test_user_id, 0, 5999.00, NULL, NULL, 0.00, 
   '张三', '13800138001', '北京市海淀区中关村大街1号', NULL, NULL, 
   NULL, '请尽快发货', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
RETURNING id INTO order_id_1;
   
  -- 已支付订单
INSERT INTO orders (order_no, user_id, status, total_amount, payment_method, payment_time, shipping_fee, 
                   recipient_name, recipient_phone, recipient_address, tracking_number, shipping_time, 
                   completion_time, buyer_note, created_at, updated_at)
VALUES
  ('ORD202502240001', test_user_id, 1, 15999.00, '支付宝', NOW() - INTERVAL '4 days', 0.00, 
   '李四', '13800138002', '上海市浦东新区张江高科技园区', NULL, NULL, 
   NULL, '周末送达', NOW() - INTERVAL '4 days 12 hours', NOW() - INTERVAL '4 days')
RETURNING id INTO order_id_2;
   
  -- 已发货订单
INSERT INTO orders (order_no, user_id, status, total_amount, payment_method, payment_time, shipping_fee, 
                   recipient_name, recipient_phone, recipient_address, tracking_number, shipping_time, 
                   completion_time, buyer_note, created_at, updated_at)
VALUES
  ('ORD202502230001', test_user_id, 2, 6999.00, '微信支付', NOW() - INTERVAL '3 days 12 hours', 0.00, 
   '王五', '13800138003', '广州市天河区天河路385号', 'SF1234567890', NOW() - INTERVAL '3 days', 
   NULL, '工作日送达', NOW() - INTERVAL '3 days 18 hours', NOW() - INTERVAL '3 days')
RETURNING id INTO order_id_3;
   
  -- 已完成订单
INSERT INTO orders (order_no, user_id, status, total_amount, payment_method, payment_time, shipping_fee, 
                   recipient_name, recipient_phone, recipient_address, tracking_number, shipping_time, 
                   completion_time, buyer_note, created_at, updated_at)
VALUES
  ('ORD202502150001', test_user_id, 3, 3999.00, '银行卡', NOW() - INTERVAL '13 days', 0.00, 
   '赵六', '13800138004', '深圳市南山区科技园', 'YT0987654321', NOW() - INTERVAL '12 days', 
   NOW() - INTERVAL '10 days', NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '10 days')
RETURNING id INTO order_id_4;
   
  -- 已取消订单
INSERT INTO orders (order_no, user_id, status, total_amount, payment_method, payment_time, shipping_fee, 
                   recipient_name, recipient_phone, recipient_address, tracking_number, shipping_time, 
                   completion_time, buyer_note, created_at, updated_at)
VALUES
  ('ORD202502200001', test_user_id, 4, 9999.00, NULL, NULL, 0.00, 
   '孙七', '13800138005', '成都市武侯区人民南路四段', NULL, NULL, 
   NULL, '暂时不需要了', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days 12 hours')
RETURNING id INTO order_id_5;

-- 插入订单商品数据
INSERT INTO order_items (order_id, product_id, sku_id, product_name, product_image, sku_code, spec_info, 
                        price, quantity, total_price, is_reviewed, created_at)
VALUES
  -- 订单1的商品
  (order_id_1, iphone_id, sku_id_1, 'iPhone 13', 'https://example.com/iphone13.jpg', 'IP13-128-BLACK', '黑色, 128GB', 
   5999.00, 1, 5999.00, false, NOW() - INTERVAL '5 days'),
   
  -- 订单2的商品
  (order_id_2, macbook_id, sku_id_5, 'MacBook Pro', 'https://example.com/macbookpro.jpg', 'MBP-16-512-SILVER', '银色, 16GB, 512GB', 
   15999.00, 1, 15999.00, false, NOW() - INTERVAL '4 days 2 hours'),
   
  -- 订单3的商品
  (order_id_3, huawei_id, sku_id_6, '华为Mate 40 Pro', 'https://example.com/mate40pro.jpg', 'HW-M40P-256-BLACK', '黑色, 256GB', 
   6999.00, 1, 6999.00, false, NOW() - INTERVAL '3 days 5 hours'),
   
  -- 订单4的商品
  (order_id_4, xiaomi_id, sku_id_7, '小米11', 'https://example.com/mi11.jpg', 'MI11-128-BLUE', '蓝色, 128GB', 
   3999.00, 1, 3999.00, true, NOW() - INTERVAL '10 days 3 hours'),
   
  -- 订单5的商品
  (order_id_5, thinkpad_id, sku_id_8, '联想ThinkPad X1', 'https://example.com/thinkpadx1.jpg', 'TP-X1-16-512-BLACK', '黑色, 16GB, 512GB', 
   9999.00, 1, 9999.00, false, NOW() - INTERVAL '8 days');

-- 插入库存操作日志
INSERT INTO inventory_logs (product_id, sku_id, operation_type, quantity, reference_type, reference_id, user_id, created_at)
VALUES
  -- 入库操作
  (iphone_id, sku_id_1, 1, 100, NULL, NULL, test_user_id, NOW() - INTERVAL '60 days'),
  (iphone_id, sku_id_2, 1, 80, NULL, NULL, test_user_id, NOW() - INTERVAL '60 days'),
  (iphone_id, sku_id_3, 1, 50, NULL, NULL, test_user_id, NOW() - INTERVAL '60 days'),
  (macbook_id, sku_id_4, 1, 30, NULL, NULL, test_user_id, NOW() - INTERVAL '55 days'),
  (macbook_id, sku_id_5, 1, 20, NULL, NULL, test_user_id, NOW() - INTERVAL '55 days'),
  (huawei_id, sku_id_6, 1, 60, NULL, NULL, test_user_id, NOW() - INTERVAL '50 days'),
  (xiaomi_id, sku_id_7, 1, 100, NULL, NULL, test_user_id, NOW() - INTERVAL '45 days'),
  (thinkpad_id, sku_id_8, 1, 15, NULL, NULL, test_user_id, NOW() - INTERVAL '40 days'),
  
  -- 出库操作（订单发货）
  (huawei_id, sku_id_6, 2, -1, 'order', order_id_3, test_user_id, NOW() - INTERVAL '3 days'),
  (xiaomi_id, sku_id_7, 2, -1, 'order', order_id_4, test_user_id, NOW() - INTERVAL '12 days'),
  
  -- 库存调整
  (iphone_id, sku_id_1, 3, -5, NULL, NULL, test_user_id, NOW() - INTERVAL '30 days'),
  (macbook_id, sku_id_5, 3, 5, NULL, NULL, test_user_id, NOW() - INTERVAL '25 days');

END $$;
