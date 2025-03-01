<template>
  <div class="database-setup-container">
    <a-card title="数据库设置" :bordered="false">
      <a-alert
        v-if="message.show"
        :message="message.content"
        :type="message.type"
        show-icon
        style="margin-bottom: 16px"
      />
      
      <a-space direction="vertical" style="width: 100%">
        <a-card title="SKU表结构设置" size="small">
          <p>
            此操作将创建SKU相关的表结构，包括：
            <ul>
              <li>product_skus表：存储SKU信息</li>
              <li>为inventory表添加sku_id字段：关联SKU</li>
            </ul>
          </p>
          
          <a-button 
            type="primary" 
            :loading="loading.setupSku" 
            @click="setupSkuTables"
          >
            创建SKU表结构
          </a-button>
        </a-card>
        
        <a-card title="视图设置" size="small">
          <p>
            此操作将创建相关的视图，包括：
            <ul>
              <li>product_skus_view视图：展示SKU信息</li>
            </ul>
          </p>
          
          <a-button 
            type="primary" 
            :loading="loading.setupViews" 
            @click="setupViews"
          >
            创建视图
          </a-button>
        </a-card>
        
        <a-card title="数据库表状态" size="small">
          <a-button 
            type="default" 
            :loading="loading.checkTables" 
            @click="checkTables"
          >
            检查表结构
          </a-button>
          
          <a-table
            :columns="tableColumns"
            :data-source="tableStatus"
            :pagination="false"
            style="margin-top: 16px"
            size="small"
            :loading="loading.checkTables"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'exists'">
                <a-tag :color="record.exists ? 'success' : 'error'">
                  {{ record.exists ? '已创建' : '未创建' }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-space>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { supabase } from '@/utils/supabase'
import { createSkuTables } from '@/utils/createSkuTables'
import { createAllViews } from '@/utils/createViews'

// 加载状态
const loading = reactive({
  setupSku: false,
  setupViews: false,
  checkTables: false
})

// 消息提示
const message = reactive({
  show: false,
  content: '',
  type: 'info'
})

// 表格列定义
const tableColumns = [
  {
    title: '表名',
    dataIndex: 'tableName',
    key: 'tableName'
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description'
  },
  {
    title: '状态',
    dataIndex: 'exists',
    key: 'exists'
  }
]

// 表状态
const tableStatus = ref([
  {
    key: '1',
    tableName: 'product_skus',
    description: 'SKU信息表',
    exists: false
  },
  {
    key: '2',
    tableName: 'inventory (sku_id)',
    description: 'inventory表中的sku_id字段',
    exists: false
  },
  {
    key: '3',
    tableName: 'inventory_view',
    description: '库存视图',
    exists: false
  },
  {
    key: '4',
    tableName: 'inventory_logs_view',
    description: '库存日志视图',
    exists: false
  }
])

// 检查表结构
async function checkTables() {
  loading.checkTables = true
  message.show = false
  
  try {
    // 检查product_skus表是否存在
    try {
      const { data, error } = await supabase
        .from('product_skus')
        .select('*', { count: 'exact', head: true })
        .limit(0);
      
      tableStatus.value[0].exists = !error;
    } catch (error) {
      tableStatus.value[0].exists = false;
    }
    
    // 检查inventory表是否有sku_id字段
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('sku_id')
        .limit(1);
      
      tableStatus.value[1].exists = !error;
    } catch (error) {
      tableStatus.value[1].exists = false;
    }
    
    // 检查视图
    try {
      const { data, error } = await supabase
        .from('inventory_view')
        .select('*', { count: 'exact', head: true })
        .limit(0);
      
      tableStatus.value[2].exists = !error;
    } catch (error) {
      tableStatus.value[2].exists = false;
    }
    
    try {
      const { data, error } = await supabase
        .from('inventory_logs_view')
        .select('*', { count: 'exact', head: true })
        .limit(0);
      
      tableStatus.value[3].exists = !error;
    } catch (error) {
      tableStatus.value[3].exists = false;
    }
    
    showMessage('表结构检查完成', 'success')
  } catch (error) {
    console.error('检查表结构时出错:', error)
    showMessage(`检查表结构时出错: ${error.message}`, 'error')
  } finally {
    loading.checkTables = false
  }
}

// 设置SKU表结构
async function setupSkuTables() {
  loading.setupSku = true
  message.show = false
  
  try {
    await createSkuTables()
    showMessage('SKU表结构创建成功！', 'success')
    // 刷新表状态
    await checkTables()
  } catch (error) {
    console.error('创建SKU表结构时出错:', error)
    showMessage(`创建SKU表结构时出错: ${error.message || error}`, 'error')
  } finally {
    loading.setupSku = false
  }
}

// 设置视图
async function setupViews() {
  loading.setupViews = true
  message.show = false
  
  try {
    await createAllViews()
    showMessage('视图创建成功！', 'success')
    // 刷新表状态
    await checkTables()
  } catch (error) {
    console.error('创建视图时出错:', error)
    showMessage(`创建视图时出错: ${error.message || error}`, 'error')
  } finally {
    loading.setupViews = false
  }
}

// 显示消息
function showMessage(content, type = 'info') {
  message.content = content
  message.type = type
  message.show = true
  
  // 5秒后自动隐藏
  setTimeout(() => {
    message.show = false
  }, 5000)
}

// 初始检查表状态
checkTables()
</script>

<style scoped>
.database-setup-container {
  padding: 24px;
}
</style>
