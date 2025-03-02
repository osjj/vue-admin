import { supabase } from './supabase'

/**
 * 确保数据库中存在必要的RPC函数
 */
export const ensureRpcFunctions = async () => {
  console.log('检查并确保RPC函数存在...');
  
  // 检查是否存在get_table_columns函数
  const { data, error } = await supabase.rpc('get_table_columns', { p_table_name: 'products' });
  
  if (error) {
    console.warn('get_table_columns函数不存在或无法访问:', error);
    console.log('请在Supabase SQL编辑器中执行以下SQL创建此函数:');
    console.log(`
-- 先删除现有函数
DROP FUNCTION IF EXISTS get_table_columns(text);

-- 创建新函数
CREATE OR REPLACE FUNCTION get_table_columns(p_table_name text)
RETURNS TABLE(column_name text, data_type text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name::text, c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_name = p_table_name
  AND c.table_schema = 'public';
END;
$$;
    `);
    
    return { success: false, message: 'get_table_columns函数不存在，但这不会影响测试' };
  } else {
    console.log('get_table_columns函数已存在');
    return { success: true, message: 'get_table_columns函数已存在' };
  }
}; 