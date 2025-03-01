<template>
  <div class="test-sku-container">
    <a-card title="SKU功能测试" :bordered="false">
      <a-alert
        v-if="message.show"
        :message="message.content"
        :type="message.type"
        show-icon
        style="margin-bottom: 16px"
      />
      
      <a-space direction="vertical" style="width: 100%">
        <a-card title="检查表结构" size="small">
          <a-button 
            type="primary" 
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
        
        <a-card title="测试获取商品列表" size="small">
          <a-button 
            type="primary" 
            :loading="loading.testGetProducts" 
            @click="testGetProducts"
          >
            测试获取商品列表
          </a-button>
          
          <div v-if="testResults.getProducts" style="margin-top: 16px">
            <a-alert
              :message="testResults.getProducts.success ? '测试成功' : '测试失败'"
              :description="testResults.getProducts.message"
              :type="testResults.getProducts.success ? 'success' : 'error'"
              show-icon
            />
          </div>
        </a-card>
        
        <a-card title="测试获取商品详情" size="small">
          <a-space>
            <a-input-number
              v-model:value="productId"
              placeholder="输入商品ID"
              style="width: 200px"
            />
            <a-button 
              type="primary" 
              :loading="loading.testGetProductById" 
              @click="testGetProductById"
            >
              测试获取商品详情
            </a-button>
          </a-space>
          
          <div v-if="testResults.getProductById" style="margin-top: 16px">
            <a-alert
              :message="testResults.getProductById.success ? '测试成功' : '测试失败'"
              :description="testResults.getProductById.message"
              :type="testResults.getProductById.success ? 'success' : 'error'"
              show-icon
            />
          </div>
        </a-card>
      </a-space>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { supabase } from '@/utils/supabase'
import { productApi } from '@/utils/productApi'

// 加载状态
const loading = reactive({
  checkTables: false,
  testGetProducts: false,
  testGetProductById: false
})

// 消息提示
const message = reactive({
  show: false,
  content: '',
  type: 'info'
})

// 商品ID
const productId = ref(1)

// 测试结果
const testResults = reactive({
  getProducts: null,
  getProductById: null
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
  }
])

// 检查表是否存在
async function checkTables() {
  loading.checkTables = true
  
  try {
    // 检查product_skus表
    let skuTableExists = false
    try {
      const { data, error } = await supabase
        .from('product_skus')
        .select('*', { count: 'exact', head: true })
        .limit(0)
      
      skuTableExists = !error
    } catch (e) {
      console.warn('检查product_skus表时出错:', e)
    }
    
    tableStatus.value[0].exists = skuTableExists
    
    // 检查inventory表的sku_id字段
    let skuIdColumnExists = false
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('sku_id')
        .limit(1)
      
      skuIdColumnExists = !error
    } catch (e) {
      console.warn('检查inventory表sku_id字段时出错:', e)
    }
    
    tableStatus.value[1].exists = skuIdColumnExists
    
    showMessage('表结构检查完成', 'success')
  } catch (error) {
    console.error('检查表结构时出错:', error)
    showMessage(`检查表结构时出错: ${error.message || error}`, 'error')
  } finally {
    loading.checkTables = false
  }
}

// 测试获取商品列表
async function testGetProducts() {
  loading.testGetProducts = true
  
  try {
    const { data, error, count } = await productApi.getProducts({
      page: 1,
      pageSize: 10
    })
    
    if (error) throw error
    
    testResults.getProducts = {
      success: true,
      message: `成功获取 ${count} 条商品数据`
    }
  } catch (error) {
    console.error('测试获取商品列表失败:', error)
    testResults.getProducts = {
      success: false,
      message: `测试失败: ${error.message}`
    }
  } finally {
    loading.testGetProducts = false
  }
}

// 测试获取商品详情
async function testGetProductById() {
  if (!productId.value || isNaN(parseInt(productId.value))) {
    showMessage('请输入有效的商品ID', 'warning')
    return
  }
  
  const id = parseInt(productId.value)
  loading.testGetProductById = true
  
  try {
    const { data, error } = await productApi.getProductById(id)
    
    if (error) throw error
    
    if (!data) {
      testResults.getProductById = {
        success: false,
        message: `未找到ID为 ${id} 的商品`
      }
      return
    }
    
    testResults.getProductById = {
      success: true,
      message: `成功获取商品: ${data.name}${data.sku_code ? ', SKU: ' + data.sku_code : ''}`
    }
  } catch (error) {
    console.error('测试获取商品详情失败:', error)
    testResults.getProductById = {
      success: false,
      message: `测试失败: ${error.message || error}`
    }
  } finally {
    loading.testGetProductById = false
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
.test-sku-container {
  padding: 24px;
}
</style>
