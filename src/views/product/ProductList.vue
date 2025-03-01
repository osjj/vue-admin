<template>
  <div class="product-list-container">
    <a-card title="商品列表" :bordered="false">
      <!-- 搜索和过滤区域 -->
      <div class="table-operations">
        <a-space>
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索商品名称/编码"
            style="width: 250px"
            @search="handleSearch"
            allow-clear
          />
          <a-select
            v-model:value="filterCategory"
            placeholder="选择分类"
            style="width: 180px"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </a-select-option>
          </a-select>
          <a-select
            v-model:value="filterBrand"
            placeholder="选择品牌"
            style="width: 180px"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option v-for="brand in brands" :key="brand.id" :value="brand.id">
              {{ brand.name }}
            </a-select-option>
          </a-select>
          <a-select
            v-model:value="filterStatus"
            placeholder="商品状态"
            style="width: 120px"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option :value="true">已上架</a-select-option>
            <a-select-option :value="false">已下架</a-select-option>
          </a-select>
        </a-space>
        <a-space>
          <a-button type="primary" @click="handleAdd">
            <template #icon><plus-outlined /></template>
            添加商品
          </a-button>
          <a-button @click="handleRefresh">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </div>

      <!-- 商品列表表格 -->
      <a-table
        :columns="columns"
        :data-source="products"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <!-- 商品图片 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'main_image'">
            <a-image
              :src="record.main_image || 'https://via.placeholder.com/80x80?text=No+Image'"
              :width="80"
              height="80"
              :preview="true"
              fallback="https://via.placeholder.com/80x80?text=Error"
            />
          </template>
          
          <!-- 商品名称 -->
          <template v-if="column.dataIndex === 'name'">
            <div>
              <div class="product-name">{{ record.name }}</div>
              <div class="product-code">编码: {{ record.product_code }}</div>
            </div>
          </template>
          
          <!-- 商品价格 -->
          <template v-if="column.dataIndex === 'price'">
            <div>
              <div class="product-price">¥{{ record.price }}</div>
              <div class="product-market-price" v-if="record.market_price">
                市场价: ¥{{ record.market_price }}
              </div>
            </div>
          </template>
          
          <!-- 商品分类 -->
          <template v-if="column.dataIndex === 'category_id'">
            {{ record.product_category?.name || '-' }}
          </template>
          
          <!-- 商品品牌 -->
          <template v-if="column.dataIndex === 'brand_id'">
            {{ record.product_brand?.name || '-' }}
          </template>
          
          <!-- 商品状态 -->
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="record.status ? 'green' : 'red'">
              {{ record.status ? '已上架' : '已下架' }}
            </a-tag>
          </template>
          
          <!-- 操作按钮 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                编辑
              </a-button>
              <a-button type="link" size="small" @click="viewInventory(record)">
                库存管理
              </a-button>
              <a-button 
                type="link" 
                size="small" 
                @click="handleToggleStatus(record)"
                :danger="record.status"
              >
                {{ record.status ? '下架' : '上架' }}
              </a-button>
              <a-popconfirm
                title="确定要删除此商品吗?"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button type="link" danger size="small">
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑商品对话框 -->
    <product-form-modal
      v-model:visible="modalVisible"
      :product="currentProduct"
      :categories="categories"
      :brands="brands"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { 
  PlusOutlined, 
  ReloadOutlined
} from '@ant-design/icons-vue'
import { productApi } from '@/utils/productApi'
import ProductFormModal from '@/components/product/ProductFormModal.vue'
import { useRouter } from 'vue-router'

// 表格列定义
const columns = [
  {
    title: '图片',
    dataIndex: 'main_image',
    width: 100,
  },
  {
    title: '商品名称',
    dataIndex: 'name',
    ellipsis: true,
    width: 250,
  },
  {
    title: '价格',
    dataIndex: 'price',
    width: 120,
    sorter: true,
  },
  {
    title: '库存',
    dataIndex: 'stock',
    width: 80,
    sorter: true,
  },
  {
    title: '分类',
    dataIndex: 'category_id',
    width: 120,
  },
  {
    title: '品牌',
    dataIndex: 'brand_id',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 170,
    sorter: true,
    customRender: ({ text }) => {
      return text ? new Date(text).toLocaleString() : '-'
    }
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 220,
    fixed: 'right'
  }
]

// 状态变量
const products = ref([])
const loading = ref(false)
const categories = ref([])
const brands = ref([])
const searchText = ref('')
const filterCategory = ref(undefined)
const filterBrand = ref(undefined)
const filterStatus = ref(undefined)
const modalVisible = ref(false)
const currentProduct = ref(null)

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条记录`,
})

// 排序配置
const sorter = ref({
  field: 'created_at',
  order: 'descend'
})

const router = useRouter()

// 初始化
onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchBrands()
  ])
  fetchProducts()
})

// 获取商品列表
const fetchProducts = async () => {
  loading.value = true
  try {
    const options = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      sort: sorter.value,
      search: searchText.value,
      filter: {
        category_id: filterCategory.value,
        brand_id: filterBrand.value,
        status: filterStatus.value
      }
    }
    
    const { data, count, error } = await productApi.getProducts(options)
    
    if (error) throw error
    
    products.value = data || []
    pagination.total = count || 0
  } catch (error) {
    console.error('获取商品列表失败:', error)
    message.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const { data, error } = await productApi.getCategories()
    if (error) throw error
    categories.value = data || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
  }
}

// 获取品牌列表
const fetchBrands = async () => {
  try {
    const { data, error } = await productApi.getBrands()
    if (error) throw error
    brands.value = data || []
  } catch (error) {
    console.error('获取品牌列表失败:', error)
    message.error('获取品牌列表失败')
  }
}

// 处理表格变化（分页、排序、筛选）
const handleTableChange = (pag, filters, sort) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  
  if (sort && sort.field) {
    sorter.value = {
      field: sort.field,
      order: sort.order
    }
  }
  
  fetchProducts()
}

// 处理搜索
const handleSearch = () => {
  pagination.current = 1
  fetchProducts()
}

// 处理刷新
const handleRefresh = () => {
  fetchProducts()
}

// 处理添加商品
const handleAdd = () => {
  currentProduct.value = null
  modalVisible.value = true
}

// 处理编辑商品
const handleEdit = (record) => {
  currentProduct.value = { ...record }
  modalVisible.value = true
}

// 处理切换商品状态
const handleToggleStatus = async (record) => {
  try {
    const { error } = await productApi.updateProduct(record.id, {
      status: !record.status,
      updated_at: new Date().toISOString()
    })
    
    if (error) throw error
    
    message.success(`商品已${record.status ? '下架' : '上架'}`)
    fetchProducts()
  } catch (error) {
    console.error('更新商品状态失败:', error)
    message.error('更新商品状态失败')
  }
}

// 处理删除商品
const handleDelete = async (record) => {
  try {
    const { error } = await productApi.deleteProduct(record.id)
    
    if (error) throw error
    
    message.success('商品已删除')
    fetchProducts()
  } catch (error) {
    console.error('删除商品失败:', error)
    message.error('删除商品失败')
  }
}

// 查看商品库存
const viewInventory = (record) => {
  router.push({
    path: '/orders/inventory',
    query: {
      product_id: record.id,
      product_name: record.name
    }
  })
}

// 处理操作成功
const handleSuccess = () => {
  modalVisible.value = false
  fetchProducts()
}
</script>

<style scoped>
.product-list-container {
  padding: 16px;
}

.table-operations {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.product-name {
  font-weight: 500;
}

.product-code {
  font-size: 12px;
  color: #999;
}

.product-price {
  color: #f5222d;
  font-weight: 500;
}

.product-market-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}
</style>
