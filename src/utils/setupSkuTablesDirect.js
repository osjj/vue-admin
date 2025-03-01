import { supabase } from './supabase';

// 执行SQL语句创建表结构
async function setupSkuTables() {
  console.log('开始创建SKU相关表结构...');
  
  try {
    // 创建product_skus表
    const createSkuTable = await supabase.from('product_skus').select('id').limit(1);
    
    if (createSkuTable.error && createSkuTable.error.code === '42P01') { // 表不存在
      console.log('创建product_skus表...');
      
      const { error: createError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE product_skus (
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
          
          CREATE INDEX idx_product_skus_product_id ON product_skus(product_id);
          CREATE INDEX idx_product_skus_sku_code ON product_skus(sku_code);
        `
      });
      
      if (createError) {
        console.error('创建product_skus表失败:', createError);
      } else {
        console.log('product_skus表创建成功！');
      }
    } else {
      console.log('product_skus表已存在');
    }
    
    // 修改inventory表，添加sku_id字段
    console.log('修改inventory表，添加sku_id字段...');
    
    const { error: alterError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE inventory ADD COLUMN IF NOT EXISTS sku_id BIGINT REFERENCES product_skus(id);
      `
    });
    
    if (alterError) {
      console.error('修改inventory表失败:', alterError);
    } else {
      console.log('inventory表修改成功！');
    }
    
    // 创建或更新inventory_view视图
    console.log('创建或更新inventory_view视图...');
    
    const { error: viewError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });
    
    if (viewError) {
      console.error('创建inventory_view视图失败:', viewError);
    } else {
      console.log('inventory_view视图创建或更新成功！');
    }
    
    console.log('SKU相关表结构设置完成！');
  } catch (error) {
    console.error('创建SKU相关表结构时出错:', error);
  }
}

// 执行设置
setupSkuTables();
