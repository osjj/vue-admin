import { supabase } from './supabase';

// 检查表是否存在
async function tableExists(tableName) {
  try {
    // 使用原生 SQL 查询检查表是否存在
    const { data, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(0);
    
    // 如果没有错误，表存在
    return !error;
  } catch (error) {
    console.error(`检查表${tableName}是否存在时出错:`, error);
    return false;
  }
}

// 创建SKU相关表结构
export async function createSkuTables() {
  try {
    console.log('开始检查并创建SKU相关表结构...');
    
    // 检查product_skus表是否存在
    const skuTableExists = await tableExists('product_skus');
    
    if (!skuTableExists) {
      console.log('创建product_skus表...');
      
      // 创建product_skus表
      try {
        // 尝试创建表，但这需要管理员权限
        console.warn('需要管理员权限来创建表，请联系管理员手动创建product_skus表');
        console.log(`
          创建表的SQL:
          CREATE TABLE product_skus (
            id BIGSERIAL PRIMARY KEY,
            product_id BIGINT REFERENCES products(id) NOT NULL,
            sku_code VARCHAR(50) NOT NULL,
            spec_info TEXT,
            price DECIMAL(10, 2) DEFAULT 0,
            stock INT DEFAULT 0,
            status BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(product_id, sku_code)
          );
        `);
      } catch (error) {
        console.error('创建product_skus表失败:', error);
        return;
      }
    } else {
      console.log('product_skus表已存在');
    }
    
    // 检查inventory表是否有sku_id字段
    try {
      // 使用原生查询检查列是否存在
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('sku_id')
        .limit(1);
      
      // 如果查询没有错误，并且返回的数据中包含sku_id字段（即使是null），则表示列存在
      const hasSkuIdColumn = !inventoryError && inventoryData !== null;
      
      if (!hasSkuIdColumn) {
        console.log('修改inventory表，添加sku_id字段...');
        
        const { error: alterError } = await supabase.rpc('alter_table_add_column', {
          table_name: 'inventory',
          column_name: 'sku_id',
          column_type: 'BIGINT REFERENCES product_skus(id)'
        });
        
        if (alterError) {
          // 如果RPC方法不存在，尝试使用原生SQL
          console.warn('RPC方法不可用，尝试直接修改表...');
          try {
            // 直接在客户端修改表（注意：这通常需要数据库权限）
            await supabase.auth.getSession().then(async ({ data: { session } }) => {
              if (session) {
                const { error } = await supabase.from('inventory').update({ sku_id: null }).eq('id', -1);
                if (error && error.code === '42703') {
                  console.error('无法修改表结构，请联系管理员手动添加sku_id字段');
                }
              }
            });
          } catch (e) {
            console.error('修改inventory表失败:', e);
          }
          return;
        }
        
        console.log('inventory表修改成功！');
      } else {
        console.log('inventory表已有sku_id字段');
      }
    } catch (error) {
      console.error('检查inventory表结构时出错:', error);
      return;
    }
    
    // 检查inventory_logs表是否有sku_id字段
    try {
      // 使用原生查询检查列是否存在
      const { data: logsData, error: logsError } = await supabase
        .from('inventory_logs')
        .select('sku_id')
        .limit(1);
      
      // 如果查询没有错误，并且返回的数据中包含sku_id字段（即使是null），则表示列存在
      const hasSkuIdColumn = !logsError && logsData !== null;
      
      if (!hasSkuIdColumn) {
        console.log('修改inventory_logs表，添加sku_id字段...');
        
        const { error: alterLogError } = await supabase.rpc('alter_table_add_column', {
          table_name: 'inventory_logs',
          column_name: 'sku_id',
          column_type: 'BIGINT REFERENCES product_skus(id)'
        });
        
        if (alterLogError) {
          // 如果RPC方法不存在，尝试使用原生SQL
          console.warn('RPC方法不可用，尝试直接修改表...');
          try {
            // 直接在客户端修改表（注意：这通常需要数据库权限）
            await supabase.auth.getSession().then(async ({ data: { session } }) => {
              if (session) {
                const { error } = await supabase.from('inventory_logs').update({ sku_id: null }).eq('id', -1);
                if (error && error.code === '42703') {
                  console.error('无法修改表结构，请联系管理员手动添加sku_id字段');
                }
              }
            });
          } catch (e) {
            console.error('修改inventory_logs表失败:', e);
          }
          return;
        }
        
        console.log('inventory_logs表修改成功！');
      } else {
        console.log('inventory_logs表已有sku_id字段');
      }
    } catch (error) {
      console.error('检查inventory_logs表结构时出错:', error);
      return;
    }
    
    // 创建视图
    await createViews();
    
    console.log('SKU相关表结构设置完成！');
  } catch (error) {
    console.error('创建SKU相关表结构时出错:', error);
  }
}

// 创建视图
async function createViews() {
  console.log('开始创建相关视图...');
  
  try {
    // 检查inventory_view视图是否存在
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('inventory_view')
        .select('*', { count: 'exact', head: true })
        .limit(0);
      
      const hasInventoryView = !viewError;
      
      if (!hasInventoryView) {
        console.log('创建inventory_view视图...');
        
        // 创建视图需要管理员权限，这里只能提示用户
        console.warn('无法自动创建视图，请联系管理员手动创建inventory_view视图');
        /* 
        管理员需要执行的SQL:
        CREATE OR REPLACE VIEW inventory_view AS
        SELECT 
          i.id,
          i.product_id,
          i.sku_id,
          i.quantity,
          p.name AS product_name,
          p.image_url AS product_image,
          s.sku_code,
          s.spec_info,
          i.updated_at
        FROM 
          inventory i
        JOIN 
          products p ON i.product_id = p.id
        LEFT JOIN 
          product_skus s ON i.sku_id = s.id
        WHERE 
          p.deleted_at IS NULL;
        */
      } else {
        console.log('inventory_view视图已存在');
      }
    } catch (error) {
      console.error('检查inventory_view视图时出错:', error);
    }
    
    // 检查inventory_logs_view视图是否存在
    try {
      const { data: logsViewData, error: logsViewError } = await supabase
        .from('inventory_logs_view')
        .select('*', { count: 'exact', head: true })
        .limit(0);
      
      const hasInventoryLogsView = !logsViewError;
      
      if (!hasInventoryLogsView) {
        console.log('创建inventory_logs_view视图...');
        
        // 创建视图需要管理员权限，这里只能提示用户
        console.warn('无法自动创建视图，请联系管理员手动创建inventory_logs_view视图');
        /* 
        管理员需要执行的SQL:
        CREATE OR REPLACE VIEW inventory_logs_view AS
        SELECT 
          il.id,
          il.operation_type,
          il.quantity,
          il.reference_type,
          il.reference_id,
          il.user_id,
          u.display_name AS user_name,
          u.email AS user_email,
          il.order_id,
          o.order_no,
          il.remark,
          il.created_at,
          il.product_id,
          p.name AS product_name,
          il.sku_id,
          s.sku_code
        FROM 
          inventory_logs il
        LEFT JOIN 
          users u ON il.user_id = u.id
        LEFT JOIN 
          orders o ON il.order_id = o.id
        LEFT JOIN 
          products p ON il.product_id = p.id
        LEFT JOIN 
          product_skus s ON il.sku_id = s.id
        WHERE 
          p.deleted_at IS NULL;
        */
      } else {
        console.log('inventory_logs_view视图已存在');
      }
    } catch (error) {
      console.error('检查inventory_logs_view视图时出错:', error);
    }
  } catch (error) {
    console.error('创建视图时出错:', error);
  }
}
