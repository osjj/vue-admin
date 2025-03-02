
<template>
  <div class="inventory-list-container">
    <a-card title="库存管理" :bordered="false">
      <!-- 搜索和操作区域 -->
      <div class="table-operations">
        <a-space>
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索商品名称/SKU"
            style="width: 250px"
            @search="handleSearch"
            allow-clear
          />
          <a-select
            v-model:value="stockFilter"
            placeholder="库存状态"
            style="width: 150px"
            @change="handleSearch"
          >
            <a-select-option value="all">全部</a-select-option>
            <a-select-option value="inStock">有库存</a-select-option>
            <a-select-option value="lowStock">库存不足</a-select-option>
            <a-select-option value="outOfStock">无库存</a-select-option>
          </a-select>
        </a-space>
        <a-space>
          <a-button type="primary" @click="showAdjustModal()">
            <template #icon><plus-outlined /></template>
            库存调整
          </a-button>
          <a-button @click="handleRefresh">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </div>

      <!-- 库存列表表格 -->
      <a-table
        :columns="columns"
        :data-source="inventoryList"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <!-- 自定义列内容 -->
        <template #bodyCell="{ column, record }">
          <!-- 商品信息 -->
          <template v-if="column.dataIndex === 'product_name'">
            <div class="product-info">
              <img v-if="record.product_image" :src="record.product_image" class="product-image" />
              <div>
                <div>{{ record.product_name }}</div>
                <div class="text-muted" v-if="record.spec_info">{{ record.spec_info }}</div>
                <div class="text-muted" v-if="record.sku_code">SKU: {{ record.sku_code }}</div>
              </div>
            </div>
          </template>
          
          <!-- 库存状态 -->
          <template v-if="column.dataIndex === 'quantity'">
            <div>
              <div>
                <a-tag :color="getStockStatusColor(record)">
                  {{ record.quantity }}
                </a-tag>
              </div>
              <div class="text-muted" v-if="record.locked_quantity > 0">
                锁定: {{ record.locked_quantity }}
              </div>
            </div>
          </template>
          
          <!-- 操作 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a @click="showAdjustModal(record)">调整库存</a>
              <a-divider type="vertical" />
              <a @click="viewInventoryLog(record)">库存记录</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 库存调整模态框 -->
    <a-modal
      v-model:visible="adjustModalVisible"
      :title="currentInventory ? '调整库存' : '新增库存'"
      @ok="handleAdjustSubmit"
      :confirmLoading="confirmLoading"
    >
      <a-form
        :model="adjustForm"
        :rules="rules"
        ref="formRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <template v-if="!currentInventory">
          <a-form-item label="商品" name="product_id">
            <a-select
              v-model:value="adjustForm.product_id"
              placeholder="选择商品"
              show-search
              :filter-option="filterProductOption"
              @change="handleProductChange"
            >
              <a-select-option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="SKU" name="sku_id" v-if="productSkus.length > 0">
            <a-select
              v-model:value="adjustForm.sku_id"
              placeholder="选择SKU"
            >
              <a-select-option v-for="sku in productSkus" :key="sku.id" :value="sku.id">
                {{ sku.spec_info }} ({{ sku.code }})
              </a-select-option>
            </a-select>
          </a-form-item>
        </template>
        
        <template v-else>
          <a-form-item label="商品">
            <span>{{ currentInventory.product_name }}</span>
          </a-form-item>
          <a-form-item label="SKU" v-if="currentInventory.spec_info">
            <span>{{ currentInventory.spec_info }}</span>
          </a-form-item>
          <a-form-item label="当前库存">
            <span>{{ currentInventory.quantity }}</span>
          </a-form-item>
        </template>
        
        <a-form-item label="操作类型" name="operation_type">
          <a-radio-group v-model:value="adjustForm.operation_type">
            <a-radio :value="1">入库</a-radio>
            <a-radio :value="2">出库</a-radio>
            <a-radio :value="3">调整</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="数量" name="quantity">
          <a-input-number
            v-model:value="adjustForm.quantity"
            :min="1"
            style="width: 100%"
            placeholder="请输入数量"
          />
        </a-form-item>
        
        <a-form-item label="备注" name="remark">
          <a-textarea
            v-model:value="adjustForm.remark"
            placeholder="请输入备注信息"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { inventoryApi } from '@/utils/inventoryApi'
import productApi from '@/utils/productApi'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const inventoryList = ref([])
const products = ref([])
const productSkus = ref([])
const searchText = ref('')
const stockFilter = ref('all')
const adjustModalVisible = ref(false)
const confirmLoading = ref(false)
const currentInventory = ref(null)

// 库存调整表单
const adjustForm = reactive({
  product_id: null,
  sku_id: null,
  operation_type: 1,
  quantity: 1,
  remark: ''
})

// 表单验证规则
const rules = {
  product_id: [{ required: true, message: '请选择商品' }],
  operation_type: [{ required: true, message: '请选择操作类型' }],
  quantity: [{ required: true, message: '请输入数量' }]
}

const formRef = ref(null)

// 表格列定义
const columns = [
  {
    title: '商品信息',
    dataIndex: 'product_name',
    width: 300,
    ellipsis: true
  },
  {
    title: '可用库存',
    dataIndex: 'quantity',
    width: 120,
    sorter: true
  },
  {
    title: '锁定库存',
    dataIndex: 'locked_quantity',
    width: 120
  },
  {
    title: '更新时间',
    dataIndex: 'updated_at',
    width: 180,
    sorter: true,
    customRender({ text }) {
      return text ? new Date(text).toLocaleString() : '-'
    }
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 180
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

// 排序配置
const sorter = ref({
  field: 'updated_at',
  order: 'descend'
})

// 获取库存状态颜色
const getStockStatusColor = (record) => {
  if (record.quantity <= 0) {
    return 'red'
  } else if (record.quantity <= 10) {
    return 'orange'
  } else {
    return 'green'
  }
}

// 获取库存列表
const fetchInventory = async () => {
  loading.value = true
  try {
    // 准备查询参数
    const options = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      search: searchText.value,
      filter: {}
    }
    
    // 应用库存状态筛选
    if (stockFilter.value === 'inStock') {
      options.filter.inStock = true
    } else if (stockFilter.value === 'lowStock') {
      options.filter.lowStock = true
    } else if (stockFilter.value === 'outOfStock') {
      options.filter.outOfStock = true
    }
    
    // 从路由参数中获取商品ID
    const productId = route.query.product_id
    if (productId) {
      options.filter.product_id = Number(productId)
    }
    
    // 使用inventoryApi获取库存列表
    const { data, count, error } = await inventoryApi.getInventoryList(options)
    
    if (error) {
      throw error
    }
    
    // 格式化数据
    inventoryList.value = data.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name || '-',
      product_image: item.product_image || item.product_main_image,
      sku_id: item.sku_id,
      sku_code: item.sku_code,
      spec_info: item.spec_info,
      quantity: item.quantity,
      locked_quantity: item.locked_quantity || 0,
      updated_at: item.updated_at
    }))
    
    pagination.total = count
    
    // 如果是从商品列表跳转来的，显示提示信息
    if (productId && data.length > 0) {
      const productName = data[0].product_name
      message.info(`正在显示商品 "${productName}" 的库存信息`)
    }
  } catch (error) {
    console.error('获取库存列表失败:', error)
    message.error('获取库存列表失败')
  } finally {
    loading.value = false
  }
}

// 获取商品列表
const fetchProducts = async () => {
  try {
    const { data, error } = await productApi.getProducts({
      status: true
    })

    if (error) throw error

    products.value = data
  } catch (error) {
    console.error('获取商品列表失败:', error)
    message.error('获取商品列表失败')
  }
}

// 根据商品ID获取SKU列表
const fetchProductSkus = async (productId) => {
  if (!productId) {
    productSkus.value = []
    return
  }
  
  try {
    const { data, error } = await productApi.getProductSkus({
      product_id: productId,
      status: true
    })

    if (error) throw error

    productSkus.value = data
  } catch (error) {
    console.error('获取商品SKU失败:', error)
    message.error('获取商品SKU失败')
  }
}

// 处理商品选择变化
const handleProductChange = (value) => {
  adjustForm.sku_id = null
  fetchProductSkus(value)
}

// 商品选择过滤
const filterProductOption = (input, option) => {
  return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 显示库存调整模态框
const showAdjustModal = (inventory = null) => {
  currentInventory.value = inventory
  
  // 重置表单
  Object.assign(adjustForm, {
    product_id: inventory ? inventory.product_id : null,
    sku_id: inventory ? inventory.sku_id : null,
    operation_type: 1,
    quantity: 1,
    remark: ''
  })
  
  // 如果是编辑模式，获取商品的SKU
  if (inventory && inventory.product_id) {
    fetchProductSkus(inventory.product_id)
  }
  
  adjustModalVisible.value = true
  
  // 重置表单验证
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 处理库存调整提交
const handleAdjustSubmit = async () => {
  try {
    await formRef.value.validate()
    
    confirmLoading.value = true
    
    // 准备调整数据
    const adjustData = {
      product_id: currentInventory.value ? currentInventory.value.product_id : adjustForm.product_id,
      sku_id: currentInventory.value ? currentInventory.value.sku_id : adjustForm.sku_id,
      operation_type: adjustForm.operation_type,
      quantity: adjustForm.quantity,
      remark: adjustForm.remark
    }
    
    // 使用inventoryApi调整库存
    const { data, error } = await inventoryApi.adjustInventory(adjustData)
    
    if (error) {
      throw error
    }
    
    message.success('库存调整成功')
    adjustModalVisible.value = false
    handleRefresh()
    
  } catch (error) {
    console.error('库存调整失败:', error)
    message.error('库存调整失败: ' + (error.message || '未知错误'))
  } finally {
    confirmLoading.value = false
  }
}

// 查看库存记录
const viewInventoryLog = (inventory) => {
  router.push({
    path: '/orders/inventory-log',
    query: {
      product_id: inventory.product_id,
      sku_id: inventory.sku_id
    }
  })
}

// 处理表格变化（分页、排序、筛选）
const handleTableChange = (pag, filters, sort) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  
  if (sort.order) {
    sorter.value.field = sort.field
    sorter.value.order = sort.order
  }
  
  fetchInventory()
}

// 处理搜索
const handleSearch = () => {
  pagination.current = 1
  fetchInventory()
}

// 处理刷新
const handleRefresh = () => {
  searchText.value = ''
  stockFilter.value = 'all'
  pagination.current = 1
  sorter.value = {
    field: 'updated_at',
    order: 'descend'
  }
  fetchInventory()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchProducts()
  fetchInventory()
})
</script>

<style scoped>
.inventory-list-container {
  padding: 16px;
}

.table-operations {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  margin-right: 10px;
  border-radius: 4px;
}

.text-muted {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-top: 4px;
}
</style>