<template>
  <div class="review-list-container">
    <a-card title="商品评论管理" :bordered="false">
      <!-- 搜索和过滤区域 -->
      <div class="table-operations">
        <a-space>
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索评论内容/用户名"
            style="width: 250px"
            @search="handleSearch"
            allow-clear
          />
          <a-select
            v-model:value="filterProduct"
            placeholder="选择商品"
            style="width: 200px"
            allow-clear
            @change="handleSearch"
            :options="productOptions"
            :filter-option="filterOption"
            show-search
          />
          <a-select
            v-model:value="filterStatus"
            placeholder="评论状态"
            style="width: 120px"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option value="pending">待审核</a-select-option>
            <a-select-option value="approved">已通过</a-select-option>
            <a-select-option value="rejected">已拒绝</a-select-option>
          </a-select>
          <a-select
            v-model:value="filterRating"
            placeholder="评分"
            style="width: 100px"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option :value="5">5星</a-select-option>
            <a-select-option :value="4">4星</a-select-option>
            <a-select-option :value="3">3星</a-select-option>
            <a-select-option :value="2">2星</a-select-option>
            <a-select-option :value="1">1星</a-select-option>
          </a-select>
        </a-space>
        <a-space>
          <a-button type="primary" @click="handleBatchApprove" :disabled="!hasSelected">
            批量通过
          </a-button>
          <a-button danger @click="handleBatchReject" :disabled="!hasSelected">
            批量拒绝
          </a-button>
          <a-button @click="handleRefresh">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </div>
      
      <!-- 评论列表表格 -->
      <a-table
        :columns="columns"
        :data-source="reviews"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
      >
        <!-- 自定义列 -->
        <template #bodyCell="{ column, record }">
          <!-- 商品信息 -->
          <template v-if="column.dataIndex === 'product_id'">
            <div class="product-info">
              <a-image
                :src="record.product?.main_image || 'https://via.placeholder.com/40x40?text=No+Image'"
                :width="40"
                height="40"
                :preview="false"
                fallback="https://via.placeholder.com/40x40?text=Error"
              />
              <div class="product-name">{{ record.product?.name || '-' }}</div>
            </div>
          </template>
          
          <!-- 评论内容 -->
          <template v-if="column.dataIndex === 'content'">
            <div class="review-content">
              <div class="review-rating">
                <a-rate :value="record.rating" disabled :count="5" />
              </div>
              <div class="review-text">{{ record.content }}</div>
              <div v-if="record.images && record.images.length > 0" class="review-images">
                <a-image
                  v-for="(image, index) in record.images"
                  :key="index"
                  :src="image"
                  :width="60"
                  height="60"
                  :preview="{ src: image }"
                  style="margin-right: 8px; margin-bottom: 8px;"
                />
              </div>
            </div>
          </template>
          
          <!-- 用户信息 -->
          <template v-if="column.dataIndex === 'user_id'">
            <div class="user-info">
              <a-avatar :size="24">{{ record.user_name?.charAt(0) || 'U' }}</a-avatar>
              <span class="user-name">{{ record.user_name || '匿名用户' }}</span>
            </div>
          </template>
          
          <!-- 评论状态 -->
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          
          <!-- 操作按钮 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button 
                v-if="record.status === 'pending'"
                type="link" 
                size="small" 
                @click="handleApprove(record)"
              >
                通过
              </a-button>
              <a-button 
                v-if="record.status === 'pending'"
                type="link" 
                danger 
                size="small" 
                @click="handleReject(record)"
              >
                拒绝
              </a-button>
              <a-button 
                type="link" 
                size="small" 
                @click="handleReply(record)"
              >
                回复
              </a-button>
              <a-popconfirm
                title="确定要删除此评论吗?"
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
    
    <!-- 回复评论对话框 -->
    <a-modal
      v-model:visible="replyModalVisible"
      title="回复评论"
      @ok="handleReplySubmit"
      :confirmLoading="submitting"
    >
      <div v-if="currentReview" class="reply-modal-content">
        <div class="original-review">
          <div class="review-user">
            <a-avatar :size="24">{{ currentReview.user_name?.charAt(0) || 'U' }}</a-avatar>
            <span class="user-name">{{ currentReview.user_name || '匿名用户' }}</span>
            <a-rate :value="currentReview.rating" disabled :count="5" size="small" />
          </div>
          <div class="review-text">{{ currentReview.content }}</div>
        </div>
        
        <a-form layout="vertical">
          <a-form-item label="回复内容" name="reply_content">
            <a-textarea
              v-model:value="replyContent"
              :rows="4"
              placeholder="请输入回复内容"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import productApi from '@/utils/productApi'

// 表格列定义
const columns = [
  {
    title: '商品',
    dataIndex: 'product_id',
    width: 200,
  },
  {
    title: '评论内容',
    dataIndex: 'content',
    ellipsis: true,
  },
  {
    title: '用户',
    dataIndex: 'user_id',
    width: 150,
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
    width: 200,
    fixed: 'right',
  }
]

// 状态变量
const reviews = ref([])
const loading = ref(false)
const searchText = ref('')
const filterProduct = ref(undefined)
const filterStatus = ref(undefined)
const filterRating = ref(undefined)
const selectedRowKeys = ref([])
const replyModalVisible = ref(false)
const currentReview = ref(null)
const replyContent = ref('')
const submitting = ref(false)
const productOptions = ref([])

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

// 计算属性：是否有选中行
const hasSelected = computed(() => selectedRowKeys.value.length > 0)

// 初始化
onMounted(async () => {
  await fetchProducts()
  fetchReviews()
})

// 获取商品列表（用于筛选）
const fetchProducts = async () => {
  try {
    const { data, error } = await productApi.getProducts({
      pageSize: 100,
      sort: { field: 'name', order: 'ascend' }
    })
    
    if (error) throw error
    
    productOptions.value = (data || []).map(product => ({
      value: product.id,
      label: product.name
    }))
  } catch (error) {
    console.error('获取商品列表失败:', error)
    message.error('获取商品列表失败')
  }
}

// 获取评论列表
const fetchReviews = async () => {
  loading.value = true
  try {
    const options = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      sort: sorter.value,
      search: searchText.value,
      productId: filterProduct.value,
      status: filterStatus.value,
      rating: filterRating.value
    }
    
    const { data, count, error } = await productApi.getReviews(options)
    
    if (error) throw error
    
    reviews.value = data || []
    pagination.total = count || 0
  } catch (error) {
    console.error('获取评论列表失败:', error)
    message.error('获取评论列表失败')
  } finally {
    loading.value = false
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
  
  fetchReviews()
}

// 处理搜索
const handleSearch = () => {
  pagination.current = 1
  fetchReviews()
}

// 处理刷新
const handleRefresh = () => {
  fetchReviews()
}

// 处理选择变化
const onSelectChange = (keys) => {
  selectedRowKeys.value = keys
}

// 处理通过评论
const handleApprove = async (record) => {
  try {
    const { error } = await productApi.updateReview(record.id, {
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    
    if (error) throw error
    
    message.success('评论已通过')
    fetchReviews()
  } catch (error) {
    console.error('更新评论状态失败:', error)
    message.error('更新评论状态失败')
  }
}

// 处理拒绝评论
const handleReject = async (record) => {
  try {
    const { error } = await productApi.updateReview(record.id, {
      status: 'rejected',
      updated_at: new Date().toISOString()
    })
    
    if (error) throw error
    
    message.success('评论已拒绝')
    fetchReviews()
  } catch (error) {
    console.error('更新评论状态失败:', error)
    message.error('更新评论状态失败')
  }
}

// 处理批量通过评论
const handleBatchApprove = async () => {
  if (selectedRowKeys.value.length === 0) return
  
  try {
    const promises = selectedRowKeys.value.map(id => 
      productApi.updateReview(id, {
        status: 'approved',
        updated_at: new Date().toISOString()
      })
    )
    
    await Promise.all(promises)
    
    message.success(`已通过 ${selectedRowKeys.value.length} 条评论`)
    selectedRowKeys.value = []
    fetchReviews()
  } catch (error) {
    console.error('批量更新评论状态失败:', error)
    message.error('批量更新评论状态失败')
  }
}

// 处理批量拒绝评论
const handleBatchReject = async () => {
  if (selectedRowKeys.value.length === 0) return
  
  try {
    const promises = selectedRowKeys.value.map(id => 
      productApi.updateReview(id, {
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
    )
    
    await Promise.all(promises)
    
    message.success(`已拒绝 ${selectedRowKeys.value.length} 条评论`)
    selectedRowKeys.value = []
    fetchReviews()
  } catch (error) {
    console.error('批量更新评论状态失败:', error)
    message.error('批量更新评论状态失败')
  }
}

// 处理回复评论
const handleReply = (record) => {
  currentReview.value = record
  replyContent.value = ''
  
  // 如果已有回复，填充回复内容
  if (record.review_replies && record.review_replies.length > 0) {
    replyContent.value = record.review_replies[0].content
  }
  
  replyModalVisible.value = true
}

// 处理提交回复
const handleReplySubmit = async () => {
  if (!replyContent.value.trim()) {
    message.error('请输入回复内容')
    return
  }
  
  submitting.value = true
  
  try {
    // 检查是否已有回复
    if (currentReview.value.review_replies && currentReview.value.review_replies.length > 0) {
      // 更新现有回复
      const replyId = currentReview.value.review_replies[0].id
      await productApi.updateReviewReply(replyId, {
        content: replyContent.value,
        updated_at: new Date().toISOString()
      })
    } else {
      // 创建新回复
      await productApi.createReviewReply({
        review_id: currentReview.value.id,
        content: replyContent.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    message.success('回复成功')
    replyModalVisible.value = false
    fetchReviews()
  } catch (error) {
    console.error('回复评论失败:', error)
    message.error('回复评论失败')
  } finally {
    submitting.value = false
  }
}

// 处理删除评论
const handleDelete = async (record) => {
  try {
    const { error } = await productApi.deleteReview(record.id)
    
    if (error) throw error
    
    message.success('评论已删除')
    fetchReviews()
  } catch (error) {
    console.error('删除评论失败:', error)
    message.error('删除评论失败')
  }
}

// 获取评论状态颜色
const getStatusColor = (status) => {
  switch (status) {
    case 'approved':
      return 'green'
    case 'rejected':
      return 'red'
    case 'pending':
    default:
      return 'orange'
  }
}

// 获取评论状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'approved':
      return '已通过'
    case 'rejected':
      return '已拒绝'
    case 'pending':
    default:
      return '待审核'
  }
}

// 下拉框筛选
const filterOption = (input, option) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
}
</script>

<style scoped>
.review-list-container {
  padding: 16px;
}

.table-operations {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-name {
  margin-left: 8px;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-content {
  display: flex;
  flex-direction: column;
}

.review-rating {
  margin-bottom: 4px;
}

.review-text {
  margin-bottom: 8px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  margin-left: 8px;
}

.reply-modal-content {
  display: flex;
  flex-direction: column;
}

.original-review {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.review-user {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.review-user .user-name {
  margin-left: 8px;
  margin-right: 8px;
}
</style>
