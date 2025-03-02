-- 先删除现有函数
DROP FUNCTION IF EXISTS get_table_columns(text);

-- 修复get_table_columns函数
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