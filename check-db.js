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

// 检查数据库连接和表结构
async function checkDatabase() {
  console.log('开始检查数据库连接和表结构...');
  
  try {
    // 检查数据库连接
    console.log('检查数据库连接...');
    const { data: connectionData, error: connectionError } = await supabase.from('products').select('count').limit(1);
    
    if (connectionError) {
      console.error('数据库连接失败:', connectionError);
    } else {
      console.log('数据库连接成功!');
    }
    
    // 检查products表
    console.log('检查products表...');
    const { data: productsData, error: productsError } = await supabase.from('products').select('id').limit(1);
    
    if (productsError) {
      console.error('products表不存在或无法访问:', productsError);
    } else {
      console.log('products表存在且可以访问');
      
      // 检查products表的列
      console.log('检查products表的列结构...');
      try {
        // 尝试获取products表的所有列
        const { data: columnsData, error: columnsError } = await supabase
          .from('products')
          .select('*')
          .limit(1);
        
        if (columnsError) {
          console.error('获取products表列结构失败:', columnsError);
        } else if (columnsData && columnsData.length > 0) {
          const columns = Object.keys(columnsData[0]);
          console.log('products表的列:', columns.join(', '));
          
          // 检查是否有code列或product_code列
          if (!columns.includes('code') && !columns.includes('product_code')) {
            console.error('警告: products表中没有code或product_code列，这可能导致测试失败');
          }
        } else {
          console.log('products表为空，无法获取列结构');
        }
      } catch (error) {
        console.error('检查products表列结构时出错:', error);
      }
    }
    
    // 检查product_skus表
    console.log('检查product_skus表...');
    const { data: skusData, error: skusError } = await supabase.from('product_skus').select('id').limit(1);
    
    if (skusError) {
      console.error('product_skus表不存在或无法访问:', skusError);
      console.log('需要创建product_skus表，请在Supabase SQL编辑器中执行以下SQL:');
      console.log(`
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

CREATE INDEX IF NOT EXISTS idx_product_skus_product_id ON product_skus(product_id);
CREATE INDEX IF NOT EXISTS idx_product_skus_sku_code ON product_skus(sku_code);
      `);
    } else {
      console.log('product_skus表存在且可以访问');
      
      // 检查product_skus表的列结构
      try {
        const { data: skuColumnsData, error: skuColumnsError } = await supabase
          .from('product_skus')
          .select('*')
          .limit(1);
        
        if (skuColumnsError) {
          console.error('获取product_skus表列结构失败:', skuColumnsError);
        } else if (skuColumnsData && skuColumnsData.length > 0) {
          const skuColumns = Object.keys(skuColumnsData[0]);
          console.log('product_skus表的列:', skuColumns.join(', '));
          
          // 检查是否有stock_warning列
          if (!skuColumns.includes('stock_warning')) {
            console.error('警告: product_skus表中没有stock_warning列，需要添加此列');
            console.log('请在Supabase SQL编辑器中执行以下SQL:');
            console.log(`
ALTER TABLE product_skus ADD COLUMN IF NOT EXISTS stock_warning INTEGER DEFAULT 0;
            `);
          }
        } else {
          console.log('product_skus表为空，无法获取列结构');
        }
      } catch (error) {
        console.error('检查product_skus表列结构时出错:', error);
      }
    }
    
    // 检查inventory表
    console.log('检查inventory表...');
    const { data: inventoryData, error: inventoryError } = await supabase.from('inventory').select('id').limit(1);
    
    if (inventoryError) {
      console.error('inventory表不存在或无法访问:', inventoryError);
    } else {
      console.log('inventory表存在且可以访问');
      
      // 检查inventory表是否有sku_id字段
      try {
        const { data: skuIdData, error: skuIdError } = await supabase.from('inventory').select('sku_id').limit(1);
        
        if (skuIdError && skuIdError.code === '42703') { // 列不存在
          console.error('inventory表中缺少sku_id字段，需要添加此字段');
          console.log('请在Supabase SQL编辑器中执行以下SQL:');
          console.log(`
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS sku_id BIGINT REFERENCES product_skus(id);
          `);
        } else if (skuIdError) {
          console.error('检查sku_id字段时出错:', skuIdError);
        } else {
          console.log('inventory表中存在sku_id字段');
        }
      } catch (error) {
        console.error('检查sku_id字段时出错:', error);
      }
    }
    
    // 检查get_table_columns函数
    console.log('检查get_table_columns函数...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_table_columns', { table_name: 'products' });
    
    if (rpcError) {
      console.error('get_table_columns函数不存在或无法访问:', rpcError);
      console.log('需要创建get_table_columns函数，请在Supabase SQL编辑器中执行以下SQL:');
      console.log(`
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
      `);
    } else {
      console.log('get_table_columns函数存在且可以访问');
    }
    
    console.log('数据库检查完成!');
  } catch (error) {
    console.error('检查数据库时出错:', error);
  }
}

// 执行检查
checkDatabase(); 