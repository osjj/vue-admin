
<template>
  <div class="inventory-log-container">
    <a-card :title="productInfo ? '商品库存日志' : '全部库存日志'" :bordered="false">
      <!-- 搜索和过滤区域 -->
      <div class="table-operations">
        <a-space>
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
        :columns="getColumns"
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
          
          <!-- 商品名称 -->
          <template v-if="column.dataIndex === 'product_name'">
            {{ record.product_name }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, h } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { inventoryApi } from '@/utils/inventoryApi'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const logs = ref([])
const productInfo = ref(null)
const operationType = ref(null)
const dateRange = ref(null)

// 表格列定义
const getColumns = computed(() => {
  const baseColumns = [
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      width: 100,
      customRender: ({ text }) => {
        // 使用数组作为子节点，而不是函数
        return h('a-tag', { color: getOperationTypeColor(text) }, [getOperationTypeText(text)]);
      }
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      sorter: true
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
      customRender: ({ text }) => {
        return h('span', {}, [text ? new Date(text).toLocaleString() : '-']);
      }
    }
  ]

  // 如果没有商品信息，添加商品名称列
  if (!productInfo.value) {
    baseColumns.unshift({
      title: '商品名称',
      dataIndex: 'product_name',
      width: 200,
      ellipsis: true,
      key: 'product_name'
    })
  }

  return baseColumns
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => {
    return `共 ${total} 条`
  }
})

// 获取操作类型文本
const getOperationTypeText = (type) => {
  const types = {
    1: '入库',
    2: '出库',
    3: '调整'
  }
  return types[type] || '未知'
}

// 获取操作类型颜色
const getOperationTypeColor = (type) => {
  const colors = {
    1: 'green',
    2: 'red',
    3: 'blue'
  }
  return colors[type] || 'default'
}

// 获取商品信息
const fetchProductInfo = async () => {
  try {
    // 从路由参数获取商品ID和SKU ID
    const productId = route.query.product_id ? Number(route.query.product_id) : null
    const skuId = route.query.sku_id ? Number(route.query.sku_id) : null
    
    // 如果没有商品ID，则不显示商品信息，显示所有库存日志
    if (!productId) {
      productInfo.value = null
      return
    }
    
    // 使用inventoryApi获取商品库存信息
    const { data, error } = await inventoryApi.getInventoryByProductId(productId, skuId)
    
    if (error) {
      throw error
    }
    
    if (data && data.length > 0) {
      const inventory = data[0]
      productInfo.value = {
        id: inventory.product_id,
        name: inventory.product_name,
        image: inventory.product_image,
        stock: inventory.quantity,
        sku_info: inventory.spec_info ? `${inventory.spec_info} (${inventory.sku_code || ''})` : inventory.sku_code
      }
    } else {
      message.warning('未找到该商品的库存信息')
      productInfo.value = null
    }
  } catch (error) {
    console.error('获取商品信息失败:', error)
    message.error('获取商品信息失败')
    productInfo.value = null
  }
}

// 获取库存日志
const fetchInventoryLogs = async () => {
  loading.value = true
  try {
    // 从路由参数获取商品ID和SKU ID
    const productId = route.query.product_id ? Number(route.query.product_id) : null
    const skuId = route.query.sku_id ? Number(route.query.sku_id) : null
    
    // 准备查询参数
    const options = {
      page: pagination.current,
      pageSize: pagination.pageSize
    }
    
    // 如果有商品ID，则添加到查询参数
    if (productId) {
      options.productId = productId
      if (skuId) {
        options.skuId = skuId
      }
    }
    
    // 应用操作类型筛选
    if (operationType.value) {
      options.operationType = operationType.value
    }
    
    // 应用日期范围筛选
    if (dateRange.value && dateRange.value.length === 2) {
      options.startDate = dateRange.value[0].format('YYYY-MM-DD')
      options.endDate = dateRange.value[1].format('YYYY-MM-DD')
    }
    
    // 使用inventoryApi获取库存日志
    const { data, error, count } = await inventoryApi.getInventoryLogs(options)
    
    if (error) {
      throw error
    }
    
    // 调试日志
    console.log('库存日志数据:', data)
    
    // 如果没有数据，使用模拟数据（仅用于开发测试）
    if (!data || data.length === 0) {
      logs.value = [
        {
          id: 1,
          operation_type: 1,
          quantity: 100,
          reference_type: 'initial',
          reference_id: null,
          operator_name: '系统',
          created_at: new Date().toISOString(),
          product_name: '测试商品1',
          product_id: 1,
          sku_id: 1,
          sku_code: 'SKU001'
        },
        {
          id: 2,
          operation_type: 2,
          quantity: 5,
          reference_type: 'order',
          reference_id: 'ORD202302280001',
          operator_name: '管理员',
          order_id: 1,
          order_no: 'ORD202302280001',
          created_at: new Date().toISOString(),
          product_name: '测试商品2',
          product_id: 2,
          sku_id: 2,
          sku_code: 'SKU002'
        }
      ]
      pagination.total = 2
    } else {
      // 格式化数据
      logs.value = data.map(item => {
        console.log('单条数据项:', item)
        return {
          id: item.id,
          operation_type: item.operation_type,
          quantity: item.quantity,
          reference_type: item.reference_type,
          reference_id: item.reference_id,
          user_id: item.user_id,
          operator_name: item.user_name || item.user_email || '-',
          order_no: item.order_no,
          order_id: item.order_id,
          remark: item.remark,
          created_at: item.created_at,
          product_name: item.product_name || '未知商品',
          product_id: item.product_id,
          sku_id: item.sku_id,
          sku_code: item.sku_code
        }
      })
      
      pagination.total = count
    }
  } catch (error) {
    console.error('获取库存日志失败:', error)
    message.error('获取库存日志失败')
  } finally {
    loading.value = false
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