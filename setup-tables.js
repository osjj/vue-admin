// 使用 dotenv 加载环境变量
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// 创建 Supabase 客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('环境变量未设置。请确保 .env 文件中包含 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL 语句
const sql = `
-- 创建product_skus表
CREATE TABLE IF NOT EXISTS product_skus (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    sku_code VARCHAR(50) NOT NULL,
    spec_info TEXT,
    price NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    stock_warning INTEGER DEFAULT 0,
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
`;

// 创建RPC函数
const createRpcFunction = `
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(column_name text, data_type text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name::text, c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_name = table_name
  AND c.table_schema = 'public';
END;
$$;
`;

// 执行SQL
async function setupTables() {
  console.log('开始创建SKU相关表结构...');
  
  try {
    // 执行主要SQL
    const { error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      if (error.message && error.message.includes('function "execute_sql" does not exist')) {
        console.error('execute_sql 函数不存在，请确保您的 Supabase 项目中已创建此函数');
        console.log('尝试直接执行SQL（这可能需要管理员权限）...');
        
        // 尝试直接执行SQL（这通常需要数据库管理员权限）
        const { error: directError } = await supabase.from('_sql').select('*').eq('query', sql);
        
        if (directError) {
          console.error('直接执行SQL失败:', directError);
          console.log('请手动在 Supabase SQL 编辑器中执行以下SQL:');
          console.log(sql);
        } else {
          console.log('SQL执行成功！');
        }
      } else {
        console.error('执行SQL失败:', error);
      }
    } else {
      console.log('SQL执行成功！');
    }
    
    // 创建RPC函数
    console.log('创建get_table_columns RPC函数...');
    const { error: rpcError } = await supabase.rpc('execute_sql', { sql: createRpcFunction });
    
    if (rpcError) {
      console.error('创建RPC函数失败:', rpcError);
    } else {
      console.log('RPC函数创建成功！');
    }
    
    console.log('SKU相关表结构设置完成！');
  } catch (error) {
    console.error('创建SKU相关表结构时出错:', error);
  }
}

// 执行设置
setupTables(); 