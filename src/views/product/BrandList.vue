<template>
  <div class="brand-list-container">
    <a-card title="商品品牌管理" :bordered="false">
      <!-- 搜索和操作区域 -->
      <div class="table-operations">
        <a-space>
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索品牌名称"
            style="width: 250px"
            @search="handleSearch"
            allow-clear
          />
          <a-select
            v-model:value="filterStatus"
            placeholder="品牌状态"
            style="width: 120px"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option :value="true">启用</a-select-option>
            <a-select-option :value="false">禁用</a-select-option>
          </a-select>
        </a-space>
        <a-space>
          <a-button type="primary" @click="handleAdd">
            <template #icon><plus-outlined /></template>
            添加品牌
          </a-button>
          <a-button @click="handleRefresh">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </div>
      
      <!-- 品牌列表表格 -->
      <a-table
        :columns="columns"
        :data-source="brands"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <!-- 自定义列 -->
        <template #bodyCell="{ column, record }">
          <!-- 品牌Logo -->
          <template v-if="column.dataIndex === 'logo'">
            <a-image
              :src="record.logo || 'https://via.placeholder.com/80x40?text=No+Logo'"
              :width="80"
              height="40"
              :preview="true"
              fallback="https://via.placeholder.com/80x40?text=Error"
            />
          </template>
          
          <!-- 品牌状态 -->
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="record.status ? 'green' : 'red'">
              {{ record.status ? '启用' : '禁用' }}
            </a-tag>
          </template>
          
          <!-- 是否推荐 -->
          <template v-if="column.dataIndex === 'is_featured'">
            <a-tag v-if="record.is_featured" color="blue">推荐</a-tag>
            <span v-else>-</span>
          </template>
          
          <!-- 操作按钮 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除此品牌吗?"
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
          
          <!-- 官网 -->
          <template v-if="column.dataIndex === 'website'">
            <a v-if="record.website" :href="record.website" target="_blank" rel="noopener noreferrer">
              {{ record.website }}
            </a>
            <span v-else>-</span>
          </template>
        </template>
      </a-table>
    </a-card>
    
    <!-- 添加/编辑品牌对话框 -->
    <a-modal
      :visible="modalVisible"
      :title="formState.id ? '编辑品牌' : '添加品牌'"
      @cancel="handleCancel"
      @ok="handleSubmit"
      :confirmLoading="submitting"
    >
      <a-form
        :model="formState"
        :rules="rules"
        ref="formRef"
        layout="vertical"
      >
        <a-form-item label="品牌名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入品牌名称" />
        </a-form-item>
        
        <a-form-item label="品牌英文名称" name="name_en">
          <a-input v-model:value="formState.name_en" placeholder="请输入品牌英文名称" />
        </a-form-item>
        
        <a-form-item label="品牌Logo" name="logo">
          <a-upload
            v-model:file-list="fileList"
            list-type="picture-card"
            :show-upload-list="true"
            :before-upload="beforeUpload"
            @preview="handlePreview"
            @change="handleChange"
            :maxCount="1"
          >
            <div v-if="fileList.length < 1">
              <plus-outlined />
              <div style="margin-top: 8px">上传</div>
            </div>
          </a-upload>
        </a-form-item>
        
        <a-form-item label="品牌描述" name="description">
          <a-textarea
            v-model:value="formState.description"
            :rows="3"
            placeholder="请输入品牌描述"
          />
        </a-form-item>
        
        <a-form-item label="品牌官网" name="website">
          <a-input v-model:value="formState.website" placeholder="请输入品牌官网地址" />
        </a-form-item>
        
        <a-form-item label="排序值" name="sort_order">
          <a-input-number
            v-model:value="formState.sort_order"
            :min="0"
            style="width: 100%"
            placeholder="数值越小越靠前"
          />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="状态" name="status">
              <a-switch
                v-model:checked="formState.status"
                :checked-children="'启用'"
                :un-checked-children="'禁用'"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="是否推荐" name="is_featured">
              <a-switch
                v-model:checked="formState.is_featured"
                :checked-children="'是'"
                :un-checked-children="'否'"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
    
    <!-- 图片预览 -->
    <a-modal
      :visible="previewVisible"
      :footer="null"
      @cancel="handlePreviewCancel"
    >
      <img alt="预览图片" style="width: 100%" :src="previewImage" />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message, Upload } from 'ant-design-vue'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import productApi from '@/utils/productApi'

// 表格列定义
const columns = [
  {
    title: 'Logo',
    dataIndex: 'logo',
    width: 100,
  },
  {
    title: '品牌名称',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: '英文名称',
    dataIndex: 'name_en',
    width: 150,
  },
  {
    title: '描述',
    dataIndex: 'description',
    ellipsis: true,
  },
  {
    title: '官网',
    dataIndex: 'website',
    width: 180,
    ellipsis: true,
  },
  {
    title: '排序',
    dataIndex: 'sort_order',
    width: 80,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 80,
  },
  {
    title: '推荐',
    dataIndex: 'is_featured',
    width: 80,
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 150,
    fixed: 'right',
  }
]

// 状态变量
const brands = ref([])
const loading = ref(false)
const searchText = ref('')
const filterStatus = ref(undefined)
const modalVisible = ref(false)
const submitting = ref(false)
const fileList = ref([])
const previewVisible = ref(false)
const previewImage = ref('')

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条记录`,
})

// 表单状态
const formRef = ref(null)
const formState = reactive({
  name: '',
  name_en: '',
  logo: '',
  description: '',
  website: '',
  sort_order: 0,
  status: true,
  is_featured: false
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }]
}

// 初始化
onMounted(() => {
  fetchBrands()
})

// 获取品牌列表
const fetchBrands = async () => {
  loading.value = true
  try {
    const { data, count, error } = await productApi.getBrands({
      page: pagination.current,
      pageSize: pagination.pageSize,
      search: searchText.value,
      status: filterStatus.value
    })
    
    if (error) throw error
    
    brands.value = data || []
    pagination.total = count || 0
  } catch (error) {
    console.error('获取品牌列表失败:', error)
    message.error('获取品牌列表失败')
  } finally {
    loading.value = false
  }
}

// 处理表格变化（分页、排序、筛选）
const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchBrands()
}

// 处理搜索
const handleSearch = () => {
  pagination.current = 1
  fetchBrands()
}

// 处理刷新
const handleRefresh = () => {
  fetchBrands()
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  Object.keys(formState).forEach(key => {
    if (key !== 'status' && key !== 'sort_order') {
      formState[key] = ''
    }
  })
  formState.id = undefined
  formState.status = true
  formState.is_featured = false
  formState.sort_order = 0
  fileList.value = []
}

// 处理添加品牌
const handleAdd = () => {
  resetForm()
  modalVisible.value = true
}

// 处理编辑品牌
const handleEdit = (record) => {
  resetForm()
  
  // 填充表单数据
  Object.keys(formState).forEach(key => {
    if (record[key] !== undefined) {
      formState[key] = record[key]
    }
  })
  formState.id = record.id
  
  // 处理Logo
  if (record.logo) {
    fileList.value = [{
      uid: '-1',
      name: 'logo.png',
      status: 'done',
      url: record.logo
    }]
  }
  
  modalVisible.value = true
}

// 处理删除品牌
const handleDelete = async (record) => {
  try {
    const { error } = await productApi.deleteBrand(record.id)
    
    if (error) throw error
    
    message.success('删除品牌成功')
    fetchBrands()
  } catch (error) {
    console.error('删除品牌失败:', error)
    message.error('删除品牌失败')
  }
}

// 处理取消
const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

// 处理提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    // 准备提交数据
    const formData = { ...formState }
    delete formData.id
    
    // 添加时间戳
    formData.updated_at = new Date().toISOString()
    
    let result
    
    if (formState.id) {
      // 更新品牌
      result = await productApi.updateBrand(formState.id, formData)
    } else {
      // 创建品牌
      formData.created_at = new Date().toISOString()
      result = await productApi.createBrand(formData)
    }
    
    if (result.error) throw result.error
    
    // 处理Logo上传
    const brandId = formState.id || result.data[0].id
    await handleLogoUpload(brandId)
    
    message.success(`${formState.id ? '更新' : '创建'}品牌成功`)
    modalVisible.value = false
    fetchBrands()
  } catch (error) {
    console.error(`${formState.id ? '更新' : '创建'}品牌失败:`, error)
    message.error(`${formState.id ? '更新' : '创建'}品牌失败: ${error.message || '未知错误'}`)
  } finally {
    submitting.value = false
  }
}

// 处理Logo上传
const handleLogoUpload = async (brandId) => {
  for (const file of fileList.value) {
    if (file.originFileObj) {
      try {
        const { url } = await productApi.uploadFile(file.originFileObj, 'brands')
        await productApi.updateBrand(brandId, { logo: url })
      } catch (error) {
        console.error('上传Logo失败:', error)
        message.error('上传Logo失败')
      }
    }
  }
}

// 图片上传前验证
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件!')
  }
  
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过2MB!')
  }
  
  return isImage && isLt2M ? true : false
}

// 处理图片变化
const handleChange = ({ fileList: newFileList }) => {
  fileList.value = newFileList
  
  // 如果有上传成功的图片，更新表单中的Logo字段
  const successFile = newFileList.find(file => file.status === 'done' && file.response)
  if (successFile && successFile.response && successFile.response.url) {
    formState.logo = successFile.response.url
  }
}

// 处理图片预览
const handlePreview = (file) => {
  previewImage.value = file.url || file.preview
  previewVisible.value = true
}

// 处理预览取消
const handlePreviewCancel = () => {
  previewVisible.value = false
}
</script>

<style scoped>
.brand-list-container {
  padding: 16px;
}

.table-operations {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
</style>
