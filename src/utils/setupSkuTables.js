import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取SQL文件
const sqlFilePath = path.join(__dirname, 'create_sku_tables.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// 执行SQL语句
async function setupSkuTables() {
  console.log('开始创建SKU相关表结构...');
  
  try {
    // 分割SQL语句并逐个执行
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
        
        if (error) {
          console.error('执行SQL语句失败:', error);
          console.error('SQL语句:', statement.trim());
        }
      }
    }
    
    console.log('SKU相关表结构创建完成！');
  } catch (error) {
    console.error('创建SKU相关表结构时出错:', error);
  }
}

// 执行设置
setupSkuTables();
