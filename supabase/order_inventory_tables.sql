-- 订单和库存模块数据库表结构 (简化版)

-- 订单主表
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL UNIQUE,  -- 订单编号
  user_id UUID NOT NULL REFERENCES auth.users(id),  -- 用户ID
  status SMALLINT NOT NULL DEFAULT 0,  -- 订单状态：0-待支付，1-已支付，2-已发货，3-已完成，4-已取消
  total_amount DECIMAL(10, 2) NOT NULL,  -- 订单总金额
  payment_method VARCHAR(50),  -- 支付方式
  payment_time TIMESTAMPTZ,  -- 支付时间
  shipping_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- 运费
  recipient_name VARCHAR(100) NOT NULL,  -- 收件人姓名
  recipient_phone VARCHAR(20) NOT NULL,  -- 联系电话
  recipient_address TEXT NOT NULL,  -- 收货地址
  tracking_number VARCHAR(100),  -- 物流单号
  shipping_time TIMESTAMPTZ,  -- 发货时间
  completion_time TIMESTAMPTZ,  -- 完成时间
  buyer_note VARCHAR(500),  -- 买家备注
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE orders IS '订单主表';
CREATE INDEX idx_order_user_id ON orders(user_id);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_created_at ON orders(created_at);

-- 订单商品表
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  sku_id BIGINT REFERENCES product_skus(id),  -- SKU ID，可以为空（如果商品没有SKU）
  product_name VARCHAR(255) NOT NULL,  -- 商品名称（下单时）
  product_image VARCHAR(255),  -- 商品图片
  sku_code VARCHAR(50),  -- SKU编码（下单时）
  spec_info VARCHAR(255),  -- 规格信息（下单时）
  price DECIMAL(10, 2) NOT NULL,  -- 单价（下单时）
  quantity INTEGER NOT NULL,  -- 数量
  total_price DECIMAL(10, 2) NOT NULL,  -- 总价
  is_reviewed BOOLEAN NOT NULL DEFAULT false,  -- 是否已评价
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE order_items IS '订单商品表';
CREATE INDEX idx_item_order_id ON order_items(order_id);
CREATE INDEX idx_item_product_id ON order_items(product_id);

-- 仓库表
CREATE TABLE IF NOT EXISTS warehouses (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,  -- 仓库名称
  address VARCHAR(255),  -- 仓库地址
  is_default BOOLEAN NOT NULL DEFAULT false,  -- 是否默认仓库
  status BOOLEAN NOT NULL DEFAULT true,  -- 状态：true-启用，false-禁用
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE warehouses IS '仓库表';

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  sku_id BIGINT REFERENCES product_skus(id),  -- SKU ID，可以为空（如果商品没有SKU）
  quantity INTEGER NOT NULL DEFAULT 0,  -- 库存数量
  locked_quantity INTEGER NOT NULL DEFAULT 0,  -- 锁定库存数量（已下单但未发货）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(warehouse_id, product_id, sku_id)  -- 同一仓库的同一商品SKU只能有一条库存记录
);
COMMENT ON TABLE inventory IS '库存表';
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_sku_id ON inventory(sku_id);

-- 库存操作日志表
CREATE TABLE IF NOT EXISTS inventory_logs (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  sku_id BIGINT REFERENCES product_skus(id),
  operation_type SMALLINT NOT NULL,  -- 操作类型：1-入库，2-出库，3-库存调整
  quantity INTEGER NOT NULL,  -- 操作数量（正数为增加，负数为减少）
  reference_type VARCHAR(50),  -- 关联单据类型：order-订单
  reference_id BIGINT,  -- 关联单据ID
  user_id UUID REFERENCES auth.users(id),  -- 操作人ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE inventory_logs IS '库存操作日志表';
CREATE INDEX idx_inventory_log_product_id ON inventory_logs(product_id);
CREATE INDEX idx_inventory_log_created_at ON inventory_logs(created_at);

-- 启用行级安全策略
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- 创建基本的安全策略
CREATE POLICY "允许认证用户读取订单" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "允许用户查看自己的订单" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "允许管理员查看所有订单" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 创建自动更新时间戳的触发器
CREATE TRIGGER update_order_timestamp BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_warehouse_timestamp BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_inventory_timestamp BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- 创建订单编号生成函数
CREATE OR REPLACE FUNCTION generate_order_no()
RETURNS TEXT AS $$
DECLARE
  order_prefix TEXT := 'ORD';
  order_date TEXT := to_char(NOW(), 'YYYYMMDD');
  order_random TEXT := lpad(floor(random() * 10000)::TEXT, 4, '0');
BEGIN
  RETURN order_prefix || order_date || order_random;
END;
$$ LANGUAGE plpgsql;

-- 创建订单创建触发器
CREATE OR REPLACE FUNCTION before_insert_order()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果没有提供订单编号，则自动生成
  IF NEW.order_no IS NULL OR NEW.order_no = '' THEN
    NEW.order_no := generate_order_no();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_order_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE PROCEDURE before_insert_order();

-- 创建订单完成后自动更新商品销量的触发器
CREATE OR REPLACE FUNCTION after_order_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果订单状态变为已完成，更新商品销量
  IF NEW.status = 3 AND OLD.status <> 3 THEN
    -- 更新商品销量
    UPDATE products p
    SET sales = p.sales + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_order_completed_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE PROCEDURE after_order_completed();

-- 创建订单商品评价状态更新触发器
CREATE OR REPLACE FUNCTION after_insert_product_review()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新订单商品的评价状态
  UPDATE order_items
  SET is_reviewed = true
  WHERE order_id = NEW.order_id AND product_id = NEW.product_id;
  
  -- 更新商品的评分
  UPDATE products p
  SET rating = (
    SELECT AVG(rating)
    FROM product_reviews
    WHERE product_id = p.id AND status = 1
  )
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_insert_product_review_trigger
  AFTER INSERT ON product_reviews
  FOR EACH ROW EXECUTE PROCEDURE after_insert_product_review();

-- 创建简单的库存更新函数
CREATE OR REPLACE FUNCTION update_inventory(
  p_product_id BIGINT,
  p_sku_id BIGINT,
  p_quantity INTEGER,
  p_operation_type SMALLINT,
  p_reference_type VARCHAR,
  p_reference_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
  v_warehouse_id BIGINT;
  v_current_quantity INTEGER;
BEGIN
  -- 获取默认仓库ID
  SELECT id INTO v_warehouse_id
  FROM warehouses
  WHERE is_default = true
  LIMIT 1;
  
  -- 如果没有默认仓库，取第一个仓库
  IF v_warehouse_id IS NULL THEN
    SELECT id INTO v_warehouse_id
    FROM warehouses
    LIMIT 1;
    
    -- 如果还是没有仓库，创建一个默认仓库
    IF v_warehouse_id IS NULL THEN
      INSERT INTO warehouses (name, address, is_default, status)
      VALUES ('默认仓库', '默认地址', true, true)
      RETURNING id INTO v_warehouse_id;
    END IF;
  END IF;
  
  -- 获取当前库存
  SELECT quantity INTO v_current_quantity
  FROM inventory
  WHERE product_id = p_product_id 
    AND (p_sku_id IS NULL OR sku_id = p_sku_id)
    AND warehouse_id = v_warehouse_id;
  
  -- 如果没有库存记录，创建一条
  IF NOT FOUND THEN
    INSERT INTO inventory (
      warehouse_id,
      product_id,
      sku_id,
      quantity,
      locked_quantity
    ) VALUES (
      v_warehouse_id,
      p_product_id,
      p_sku_id,
      CASE WHEN p_operation_type = 1 THEN p_quantity ELSE 0 END,
      0
    );
    
    v_current_quantity := 0;
  ELSE
    -- 更新库存
    UPDATE inventory
    SET quantity = CASE 
                     WHEN p_operation_type = 1 THEN quantity + p_quantity  -- 入库
                     WHEN p_operation_type = 2 THEN quantity - p_quantity  -- 出库
                     ELSE quantity  -- 其他操作不改变总库存
                   END,
        locked_quantity = CASE 
                            WHEN p_operation_type = 3 THEN locked_quantity + p_quantity  -- 锁定库存
                            WHEN p_operation_type = 4 THEN locked_quantity - p_quantity  -- 解锁库存
                            WHEN p_operation_type = 2 THEN locked_quantity - p_quantity  -- 出库时减少锁定库存
                            ELSE locked_quantity  -- 其他操作不改变锁定库存
                          END
    WHERE product_id = p_product_id 
      AND (p_sku_id IS NULL OR sku_id = p_sku_id)
      AND warehouse_id = v_warehouse_id;
  END IF;
  
  -- 记录库存日志
  INSERT INTO inventory_logs (
    product_id,
    sku_id,
    operation_type,
    quantity,
    reference_type,
    reference_id,
    user_id
  ) VALUES (
    p_product_id,
    p_sku_id,
    p_operation_type,
    CASE WHEN p_operation_type = 2 THEN -p_quantity ELSE p_quantity END,
    p_reference_type,
    p_reference_id,
    auth.uid()
  );
  
  -- 同步更新商品表的库存
  UPDATE products
  SET stock = (
    SELECT SUM(quantity)
    FROM inventory
    WHERE product_id = p_product_id
  )
  WHERE id = p_product_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 创建订单状态变更触发器
CREATE OR REPLACE FUNCTION after_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- 如果订单状态变为已支付，锁定库存
  IF NEW.status = 1 AND OLD.status <> 1 THEN
    -- 锁定每个订单商品的库存
    FOR v_item IN
      SELECT product_id, sku_id, quantity
      FROM order_items
      WHERE order_id = NEW.id
    LOOP
      PERFORM update_inventory(
        v_item.product_id,
        v_item.sku_id,
        v_item.quantity,
        3,  -- 锁定库存
        'order',
        NEW.id
      );
    END LOOP;
  END IF;
  
  -- 如果订单状态变为已发货，扣减库存
  IF NEW.status = 2 AND OLD.status <> 2 THEN
    -- 扣减每个订单商品的库存
    FOR v_item IN
      SELECT product_id, sku_id, quantity
      FROM order_items
      WHERE order_id = NEW.id
    LOOP
      PERFORM update_inventory(
        v_item.product_id,
        v_item.sku_id,
        v_item.quantity,
        2,  -- 出库
        'order',
        NEW.id
      );
    END LOOP;
  END IF;
  
  -- 如果订单状态变为已取消，解锁库存
  IF NEW.status = 4 AND OLD.status <> 4 THEN
    -- 解锁每个订单商品的库存
    FOR v_item IN
      SELECT product_id, sku_id, quantity
      FROM order_items
      WHERE order_id = NEW.id
    LOOP
      PERFORM update_inventory(
        v_item.product_id,
        v_item.sku_id,
        v_item.quantity,
        4,  -- 解锁库存
        'order',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_order_status_change_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE PROCEDURE after_order_status_change();