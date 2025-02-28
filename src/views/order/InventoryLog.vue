
<template>
  <div class="inventory-log-container">
    <a-card title="库存操作日志" :bordered="false">
      <!-- 搜索和过滤区域 -->
      <div class="table-operations">
        <a-space>
          <a-select
            v-model:value="warehouseId"
            placeholder="选择仓库"
            style="width: 180px"
            @change="handleSearch"
            allow-clear
          >
            <a-select-option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </a-select-option>
          </a-select>
          <a-select
            v-model:value="operationType"
            placeholder="操作类型"
            style="width: 150px"
            @change="handleSearch"
            allow-clear
          >
            <a-select-option :value="1">入库</a-select-option>
            <a-select-option :value="2">出库</a-select-option>
            <a-select-option :value="3">库存调整</a-select-option>
          </a-select>
          <a-range-picker
            v-model:value="dateRange"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            @change="handleSearch"
          />
        </a-space>
        <a-space>
          <a-button @click="handleRefresh">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
          <a-button @click="goBack">
            <template #icon><arrow-left-outlined /></template>
            返回
          </a-button>
        </a-space>
      </div>

      <!-- 产品信息卡片 -->
      <a-card v-if="productInfo" class="product-info-card" :bordered="false" size="small">
        <div class="product-info">
          <img v-if="productInfo.image" :src="productInfo.image" class="product-image" />
          <div>
            <h3>{{ productInfo.name }}</h3>
            <div v-if="productInfo.sku_info" class="text-muted">
              规格: {{ productInfo.sku_info }}
            </div>
            <div v-if="productInfo.sku_code" class="text-muted">
              SKU: {{ productInfo.sku_code }}
            </div>
          </div>
        </div>
      </a-card>

      <!-- 库存日志表格 -->
      <a-table
        :columns="columns"
        :data-source="logs"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <!-- 自定义列内容 -->
        <template #bodyCell="{ column, record }">
          <!-- 操作类型 -->
          <template v-if="column.dataIndex === 'operation_type'">
            <a-tag :color="getOperationTypeColor(record.operation_type)">
              {{ getOperationTypeText(record.operation_type) }}
            </a-tag>
          </template>
          
          <!-- 数量 -->
          <template v-if="column.dataIndex === 'quantity'">
            <span :class="{ 'text-success': record.quantity > 0, 'text-danger': record.quantity < 0 }">
              {{ record.quantity > 0 ? '+' + record.quantity : record.quantity }}
            </span>
          </template>
          
          <!-- 关联单据 -->
          <template v-if="column.dataIndex === 'reference_type'">
            <template v-if="record.reference_type === 'order' && record.reference_id">
              <a @click="viewOrderDetail(record.reference_id)">
                订单 #{{ record.order_no }}
              </a>
            </template>
            <template v-else>
              {{ record.reference_type ? record.reference_type : '-' }}
            </template>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'
import { supabase } from '@/utils/supabase'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const logs = ref([])
const warehouses = ref([])
const productInfo = ref(null)
const warehouseId = ref(null)
const operationType = ref(null)
const dateRange = ref(null)

// 从路由参数中获取商品ID和SKU ID
const productId = computed(() => route.query.product_id)
const skuId = computed(() => route.query.sku_id)

// 表格列定义
const columns = [
  {
    title: '操作类型',
    dataIndex: 'operation_type',
    width: 120
  },
  {
    title: '数量变化',
    dataIndex: 'quantity',
    width: 100,
    sorter: true
  },
  {
    title: '仓库',
    dataIndex: 'warehouse_name',
    width: 150
  },
  {
    title: '关联单据',
    dataIndex: 'reference_type',
    width: 150
  },
  {
    title: '操作人',
    dataIndex: 'operator_name',
    width: 120
  },
  {
    title: '备注',
    dataIndex: 'remark',
    ellipsis: true
  },
  {
    title: '操作时间',
    dataIndex: 'created_at',
    width: 180,
    sorter: true,
    defaultSortOrder: 'descend',
    customRender({ text }) {
      return text ? new Date(text).toLocaleString() : '-'
    }
  }
]

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal(total) {
    return `共 ${total} 条`
  }
})

// 获取操作类型文本
const getOperationTypeText = (type) => {
  switch (type) {
    case 1: return '入库'
    case 2: return '出库'
    case 3: return '调整'
    default: return '未知'
  }
}

// 获取操作类型颜色
const getOperationTypeColor = (type) => {
  switch (type) {
    case 1: return 'green'
    case 2: return 'red'
    case 3: return 'blue'
    default: return 'default'
  }
}

// 获取商品信息
const fetchProductInfo = async () => {
  if (!productId.value) return
  
  try {
    let query = supabase
      .from('products')
      .select('id, name, image')
      .eq('id', productId.value)
      .single()
    
    const { data: product, error } = await query
    
    if (error) throw error
    
    // 如果有SKU ID，获取SKU信息
    if (skuId.value) {
      const { data: sku, error: skuError } = await supabase
        .from('product_skus')
        .select('id, code, spec_info')
        .eq('id', skuId.value)
        .single()
      
      if (skuError) throw skuError
      
      productInfo.value = {
        ...product,
        sku_code: sku.code,
        sku_info: sku.spec_info
      }
    } else {
      productInfo.value = product
    }
  } catch (error) {
    console.error('获取商品信息失败:', error)
    message.error('获取商品信息失败')
  }
}

// 获取库存日志
const fetchInventoryLogs = async () => {
  loading.value = true
  
  try {
    let query = supabase
      .from('inventory_logs')
      .select(`
        id,
        product_id,
        sku_id,
        operation_type,
        quantity,
        reference_type,
        reference_id,
        warehouse_id,
        user_id,
        remark,
        created_at,
        warehouses(name),
        profiles(full_name, email),
        orders(order_no)
      `)
      .order('created_at', { ascending: false })
    
    // 应用商品和SKU筛选
    if (productId.value) {
      query = query.eq('product_id', productId.value)
    }
    
    if (skuId.value) {
      query = query.eq('sku_id', skuId.value)
    }
    
    // 应用仓库筛选
    if (warehouseId.value) {
      query = query.eq('warehouse_id', warehouseId.value)
    }
    
    // 应用操作类型筛选
    if (operationType.value) {
      query = query.eq('operation_type', operationType.value)
    }
    
    // 应用日期范围筛选
    if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
      const startDate = dateRange.value[0].format('YYYY-MM-DD')
      const endDate = dateRange.value[1].format('YYYY-MM-DD')
      query = query
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
    }
    
    // 分页
    const from = (pagination.current - 1) * pagination.pageSize
    const to = from + pagination.pageSize - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    // 格式化数据
    logs.value = data.map(item => ({
      id: item.id,
      product_id: item.product_id,
      sku_id: item.sku_id,
      operation_type: item.operation_type,
      quantity: item.quantity,
      reference_type: item.reference_type,
      reference_id: item.reference_id,
      warehouse_id: item.warehouse_id,
      warehouse_name: item.warehouses?.name || '-',
      user_id: item.user_id,
      operator_name: item.profiles?.full_name || item.profiles?.email || '-',
      order_no: item.orders?.order_no,
      remark: item.remark,
      created_at: item.created_at
    }))
    
    pagination.total = count
    
  } catch (error) {
    console.error('获取库存日志失败:', error)
    message.error('获取库存日志失败')
  } finally {
    loading.value = false
  }
}

// 获取仓库列表
const fetchWarehouses = async () => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('id, name')
      .eq('status', true)
      .order('is_default', { ascending: false })
      .order('name')
    
    if (error) throw error
    
    warehouses.value = data
  } catch (error) {
    console.error('获取仓库列表失败:', error)
    message.error('获取仓库列表失败')
  }
}

// 查看订单详情
const viewOrderDetail = (orderId) => {
  router.push({
    name: 'order-list',
    query: { id: orderId }
  })
}

// 处理表格变化（分页、排序、筛选）
const handleTableChange = (pag, filters, sort) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchInventoryLogs()
}

// 处理搜索
const handleSearch = () => {
  pagination.current = 1
  fetchInventoryLogs()
}

// 处理刷新
const handleRefresh = () => {
  warehouseId.value = null
  operationType.value = null
  dateRange.value = null
  pagination.current = 1
  fetchInventoryLogs()
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchWarehouses()
  fetchProductInfo()
  fetchInventoryLogs()
})
</script>

<style scoped>
.inventory-log-container {
  padding: 16px;
}

.table-operations {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
}

.product-info-card {
  margin-bottom: 16px;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  margin-right: 16px;
  border-radius: 4px;
}

.text-muted {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-top: 4px;
}

.text-success {
  color: #52c41a;
  font-weight: bold;
}

.text-danger {
  color: #ff4d4f;
  font-weight: bold;
}
</style>