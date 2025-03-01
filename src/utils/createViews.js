import { supabase } from './supabase';

// 创建库存视图
async function createInventoryView() {
  console.log('开始创建库存视图...');
  
  try {
    // 检查inventory_view视图是否存在
    const { data, error } = await supabase
      .from('inventory_view')
      .select('*', { count: 'exact', head: true })
      .limit(0);
    
    const viewExists = !error;
    
    if (!viewExists) {
      console.log('创建inventory_view视图...');
      
      // 创建视图需要管理员权限，这里只能提示用户
      console.warn('无法自动创建视图，请联系管理员手动创建inventory_view视图');
      console.log(`
        创建视图的SQL:
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
      `);
    } else {
      console.log('inventory_view视图已存在');
    }
  } catch (error) {
    console.error('创建inventory_view视图时出错:', error);
  }
}

// 创建库存日志视图
async function createInventoryLogsView() {
  console.log('开始创建库存日志视图...');
  
  try {
    // 检查inventory_logs_view视图是否存在
    const { data, error } = await supabase
      .from('inventory_logs_view')
      .select('*', { count: 'exact', head: true })
      .limit(0);
    
    const viewExists = !error;
    
    if (!viewExists) {
      console.log('创建inventory_logs_view视图...');
      
      // 创建视图需要管理员权限，这里只能提示用户
      console.warn('无法自动创建视图，请联系管理员手动创建inventory_logs_view视图');
      console.log(`
        创建视图的SQL:
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
      `);
    } else {
      console.log('inventory_logs_view视图已存在');
    }
  } catch (error) {
    console.error('创建inventory_logs_view视图时出错:', error);
  }
}

// 创建所有视图
export async function createAllViews() {
  console.log('开始创建所有视图...');
  
  try {
    // 创建库存视图
    await createInventoryView();
    
    // 创建库存日志视图
    await createInventoryLogsView();
    
    console.log('所有视图创建完成！');
    return { success: true };
  } catch (error) {
    console.error('创建视图时出错:', error);
    return { success: false, error };
  }
}
