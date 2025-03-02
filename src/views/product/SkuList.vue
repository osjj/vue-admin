<template>
  <div class="sku-list-container">
    <a-card :bordered="false">
      <template #title>
        <span>SKU管理</span>
        <a-button
          type="primary"
          @click="showCreateModal"
          style="margin-left: 16px"
        >
          <template #icon><plus-outlined /></template>
          添加SKU
        </a-button>
      </template>
      
      <!-- 搜索区域 -->
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="商品名称">
                <a-input v-model:value="queryParam.productName" placeholder="请输入商品名称" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="SKU编码">
                <a-input v-model:value="queryParam.skuCode" placeholder="请输入SKU编码" />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="规格信息">
                <a-input v-model:value="queryParam.specInfo" placeholder="请输入规格信息" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row>
            <a-col :span="24" style="text-align: right">
              <a-button type="primary" @click="handleSearch">查询</a-button>
              <a-button style="margin-left: 8px" @click="resetQuery">重置</a-button>
            </a-col>
          </a-row>
        </a-form>
      </div>
      
      <!-- 数据表格 -->
      <a-table
        :columns="columns"
        :data-source="skuList"
        :loading="loading"
        :pagination="pagination"
        :row-key="record => record.id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'image_url'">
            <a-image
              v-if="record._image_url"
              :src="record._image_url"
              :width="40"
              :height="40"
              :preview="false"
              style="object-fit: cover; border-radius: 4px;"
            />
            <span v-else>-</span>
          </template>
          
          <template v-if="column.dataIndex === 'product_name'">
            <a @click="viewProduct(record.product_id)">{{ record.product_name }}</a>
          </template>
          
          <template v-if="column.dataIndex === 'spec_info'">
            <span>{{ record.spec_info || '-' }}</span>
          </template>
          
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="record.status ? 'green' : 'red'">
              {{ record.status ? '启用' : '禁用' }}
            </a-tag>
          </template>
          
          <template v-if="column.dataIndex === 'stock'">
            <span :class="{ 'text-warning': record.stock <= (record.stock_warning || 0) && record.stock > 0, 'text-danger': record.stock === 0 }">
              {{ record.stock }}
            </span>
          </template>
          
          <template v-if="column.dataIndex === 'created_at'">
            {{ record.created_at ? new Date(record.created_at).toLocaleString() : '-' }}
          </template>
          
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm
                title="确定要删除此SKU吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a class="text-danger">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
    
    <!-- SKU表单弹窗 -->
    <sku-form-modal
      :visible="modalVisible"
      @update:visible="modalVisible = $event"
      :sku="currentSku"
      @success="handleSuccess"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import productApi from '@/utils/productApi'
import { getFileUrl } from '@/utils/supabase'
import SkuFormModal from '@/components/product/SkuFormModal.vue'

export default {
  components: {
    SkuFormModal,
    PlusOutlined
  },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const skuList = ref([])
    const modalVisible = ref(false)
    const currentSku = ref(null)

    // 查询参数
    const queryParam = reactive({
      productName: '',
      skuCode: '',
      specInfo: ''
    })

    // 分页配置
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
      showSizeChanger: true,
      showTotal: (total) => `共 ${total} 条`
    })

    // 表格列定义
    const columns = [
      {
        title: 'SKU图片',
        dataIndex: 'image_url',
        width: 80,
        align: 'center'
      },
      {
        title: '商品名称',
        dataIndex: 'product_name',
        width: 200,
        ellipsis: true
      },
      {
        title: 'SKU编码',
        dataIndex: 'sku_code',
        width: 150
      },
      {
        title: '规格信息',
        dataIndex: 'spec_info',
        width: 200,
        ellipsis: true
      },
      {
        title: '价格',
        dataIndex: 'price',
        width: 100,
        sorter: true
      },
      {
        title: '库存',
        dataIndex: 'stock',
        width: 100,
        sorter: true
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        filters: [
          { text: '启用', value: true },
          { text: '禁用', value: false }
        ]
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        width: 180,
        sorter: true
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 150,
        fixed: 'right'
      }
    ]

    // 生命周期钩子
    onMounted(() => {
      fetchSkuList()
    })

    // 获取SKU列表
    const fetchSkuList = async () => {
      loading.value = true
      try {
        // 构建查询参数
        const options = {
          page: pagination.current,
          pageSize: pagination.pageSize
        }
        
        // 添加搜索条件
        if (queryParam.productName) {
          options.productName = queryParam.productName
        }
        
        if (queryParam.skuCode) {
          options.skuCode = queryParam.skuCode
        }
        
        if (queryParam.specInfo) {
          options.specInfo = queryParam.specInfo
        }
        
        const { data, error, count } = await productApi.getProductSkus(options)
        
        if (error) throw error
        
        // 处理图片URL
        if (data && data.length > 0) {
          for (const sku of data) {
            if (sku.image_url) {
              // 为每个SKU的图片获取签名URL，无论是否以http开头
              sku._image_url = await getFileUrl(sku.image_url)
            } else {
              sku._image_url = ''
            }
          }
        }
        
        skuList.value = data || []
        pagination.total = count || 0
      } catch (error) {
        console.error('获取SKU列表失败:', error)
        message.error('获取SKU列表失败')
      } finally {
        loading.value = false
      }
    }

    // 处理表格变化（排序、筛选、分页）
    const handleTableChange = (pag, filters, sorter) => {
      pagination.current = pag.current
      pagination.pageSize = pag.pageSize
      
      // 处理排序
      if (sorter && sorter.field) {
        queryParam.sort = { field: sorter.field, order: sorter.order }
      }
      
      fetchSkuList()
    }

    // 处理搜索
    const handleSearch = () => {
      pagination.current = 1
      fetchSkuList()
    }

    // 重置查询条件
    const resetQuery = () => {
      queryParam.productName = ''
      queryParam.skuCode = ''
      queryParam.specInfo = ''
      queryParam.sort = undefined
      
      pagination.current = 1
      fetchSkuList()
    }

    // 显示创建弹窗
    const showCreateModal = () => {
      currentSku.value = null
      modalVisible.value = true
    }

    // 处理编辑
    const handleEdit = (record) => {
      currentSku.value = { ...record }
      modalVisible.value = true
    }

    // 处理删除
    const handleDelete = async (record) => {
      try {
        const { error } = await productApi.deleteProductSku(record.id)
        
        if (error) throw error
        
        message.success('删除SKU成功')
        fetchSkuList()
      } catch (error) {
        console.error('删除SKU失败:', error)
        message.error('删除SKU失败')
      }
    }

    // 处理操作成功
    const handleSuccess = () => {
      modalVisible.value = false
      fetchSkuList()
    }

    // 查看商品详情
    const viewProduct = (productId) => {
      if (!productId) return
      
      // 跳转到商品详情页面或在当前页面显示商品详情
      router.push({
        path: '/products/list',
        query: { id: productId }
      })
    }

    return {
      columns,
      loading,
      skuList,
      modalVisible,
      currentSku,
      queryParam,
      pagination,
      fetchSkuList,
      handleTableChange,
      handleSearch,
      resetQuery,
      showCreateModal,
      handleEdit,
      handleDelete,
      handleSuccess,
      viewProduct
    }
  }
}
</script>

<style scoped>
.sku-list-container {
  padding: 24px;
}

.table-page-search-wrapper {
  margin-bottom: 24px;
}

.text-warning {
  color: #faad14;
}

.text-danger {
  color: #ff4d4f;
}
</style>
