<template>
  <div class="category-list-container">
    <a-card title="商品分类管理" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><plus-outlined /></template>
          添加分类
        </a-button>
      </template>
      
      <a-table
        :columns="columns"
        :data-source="categories"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :expandable="{
          defaultExpandAllRows: true,
          childrenColumnName: 'children'
        }"
      >
        <!-- 自定义列 -->
        <template #bodyCell="{ column, record }">
          <!-- 分类图标 -->
          <template v-if="column.dataIndex === 'icon'">
            <a-avatar v-if="record.icon" :src="record.icon" :size="40" />
            <a-avatar v-else :size="40" style="background-color: #87d068">
              {{ record.name.charAt(0) }}
            </a-avatar>
          </template>
          
          <!-- 分类状态 -->
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
              <a-button type="link" size="small" @click="handleAddChild(record)">
                添加子分类
              </a-button>
              <a-button type="link" size="small" @click="handleEdit(record)">
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除此分类吗?"
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
    
    <!-- 添加/编辑分类对话框 -->
    <a-modal
      :visible="modalVisible"
      :title="modalTitle"
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
        <a-form-item label="上级分类" name="parent_id">
          <a-tree-select
            v-model:value="formState.parent_id"
            style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
            :tree-data="categoryTreeData"
            placeholder="请选择上级分类，不选则为一级分类"
            tree-default-expand-all
            :disabled="!!parentCategory"
            allow-clear
          />
        </a-form-item>
        
        <a-form-item label="分类名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入分类名称" />
        </a-form-item>
        
        <a-form-item label="分类编码" name="code">
          <a-input v-model:value="formState.code" placeholder="请输入分类编码" />
        </a-form-item>
        
        <a-form-item label="分类图标" name="icon">
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
        
        <a-form-item label="分类描述" name="description">
          <a-textarea
            v-model:value="formState.description"
            :rows="3"
            placeholder="请输入分类描述"
          />
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
        
        <a-collapse v-model:activeKey="activeKey">
          <a-collapse-panel key="seo" header="SEO设置">
            <a-form-item label="SEO标题" name="seo_title">
              <a-input v-model:value="formState.seo_title" placeholder="请输入SEO标题" />
            </a-form-item>
            
            <a-form-item label="SEO关键词" name="seo_keywords">
              <a-input v-model:value="formState.seo_keywords" placeholder="请输入SEO关键词" />
            </a-form-item>
            
            <a-form-item label="SEO描述" name="seo_description">
              <a-textarea
                v-model:value="formState.seo_description"
                :rows="3"
                placeholder="请输入SEO描述"
              />
            </a-form-item>
          </a-collapse-panel>
        </a-collapse>
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { message, Upload } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import productApi from '@/utils/productApi'

// 表格列定义
const columns = [
  {
    title: '图标',
    dataIndex: 'icon',
    width: 80,
  },
  {
    title: '分类名称',
    dataIndex: 'name',
    width: 200,
  },
  {
    title: '编码',
    dataIndex: 'code',
    width: 120,
  },
  {
    title: '描述',
    dataIndex: 'description',
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
    width: 240,
    fixed: 'right',
  }
]

// 状态变量
const categories = ref([])
const loading = ref(false)
const modalVisible = ref(false)
const submitting = ref(false)
const fileList = ref([])
const previewVisible = ref(false)
const previewImage = ref('')
const activeKey = ref([])
const parentCategory = ref(null)

// 表单状态
const formRef = ref(null)
const formState = reactive({
  parent_id: null,
  name: '',
  code: '',
  icon: '',
  description: '',
  level: 1,
  path: '',
  sort_order: 0,
  status: true,
  is_featured: false,
  seo_title: '',
  seo_keywords: '',
  seo_description: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

// 计算属性：对话框标题
const modalTitle = computed(() => {
  if (parentCategory.value) {
    return `添加 ${parentCategory.value.name} 的子分类`
  }
  return formState.id ? '编辑分类' : '添加分类'
})

// 计算属性：分类树形数据
const categoryTreeData = computed(() => {
  return convertToTreeData(categories.value)
})

// 将分类列表转换为树形结构
const convertToTreeData = (list, parentId = null) => {
  return list
    .filter(item => {
      // 如果是编辑模式，排除当前编辑的分类及其子分类
      if (formState.id && (item.id === formState.id || (item.path && item.path.includes(formState.id)))) {
        return false
      }
      return item.parent_id === parentId
    })
    .map(item => ({
      title: item.name,
      value: item.id,
      key: item.id,
      children: convertToTreeData(list, item.id)
    }))
}

// 初始化
onMounted(() => {
  fetchCategories()
})

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    const { data, error } = await productApi.getCategories()
    
    if (error) throw error
    
    // 构建分类树
    const categoriesMap = {}
    data.forEach(item => {
      categoriesMap[item.id] = { ...item, children: [] }
    })
    
    const rootCategories = []
    data.forEach(item => {
      if (item.parent_id) {
        if (categoriesMap[item.parent_id]) {
          categoriesMap[item.parent_id].children.push(categoriesMap[item.id])
        }
      } else {
        rootCategories.push(categoriesMap[item.id])
      }
    })
    
    categories.value = rootCategories
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  Object.keys(formState).forEach(key => {
    if (key !== 'status' && key !== 'level' && key !== 'sort_order') {
      formState[key] = ''
    }
  })
  formState.id = undefined
  formState.parent_id = parentCategory.value ? parentCategory.value.id : null
  formState.level = parentCategory.value ? parentCategory.value.level + 1 : 1
  formState.status = true
  formState.is_featured = false
  formState.sort_order = 0
  fileList.value = []
}

// 处理添加分类
const handleAdd = () => {
  parentCategory.value = null
  resetForm()
  modalVisible.value = true
}

// 处理添加子分类
const handleAddChild = (record) => {
  parentCategory.value = record
  resetForm()
  modalVisible.value = true
}

// 处理编辑分类
const handleEdit = (record) => {
  parentCategory.value = null
  resetForm()
  
  // 填充表单数据
  Object.keys(formState).forEach(key => {
    if (record[key] !== undefined) {
      formState[key] = record[key]
    }
  })
  formState.id = record.id
  
  // 处理图标
  if (record.icon) {
    fileList.value = [{
      uid: '-1',
      name: 'icon.png',
      status: 'done',
      url: record.icon
    }]
  }
  
  modalVisible.value = true
}

// 处理删除分类
const handleDelete = async (record) => {
  // 检查是否有子分类
  if (record.children && record.children.length > 0) {
    message.error('该分类下有子分类，无法删除')
    return
  }
  
  try {
    const { error } = await productApi.deleteCategory(record.id)
    
    if (error) throw error
    
    message.success('删除分类成功')
    fetchCategories()
  } catch (error) {
    console.error('删除分类失败:', error)
    message.error('删除分类失败')
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
    
    // 处理路径
    if (formData.parent_id) {
      const parent = await productApi.getCategoryById(formData.parent_id)
      if (parent.data) {
        formData.path = parent.data.path 
          ? `${parent.data.path},${parent.data.id}` 
          : parent.data.id.toString()
      }
    } else {
      formData.path = ''
    }
    
    // 添加时间戳
    formData.updated_at = new Date().toISOString()
    
    let result
    
    if (formState.id) {
      // 更新分类
      result = await productApi.updateCategory(formState.id, formData)
    } else {
      // 创建分类
      formData.created_at = new Date().toISOString()
      result = await productApi.createCategory(formData)
    }
    
    if (result.error) throw result.error
    
    // 处理图片上传
    const categoryId = formState.id || result.data[0].id
    await handleIconUpload(categoryId)
    
    message.success(`${formState.id ? '更新' : '创建'}分类成功`)
    modalVisible.value = false
    fetchCategories()
  } catch (error) {
    console.error(`${formState.id ? '更新' : '创建'}分类失败:`, error)
    message.error(`${formState.id ? '更新' : '创建'}分类失败: ${error.message || '未知错误'}`)
  } finally {
    submitting.value = false
  }
}

// 处理图标上传
const handleIconUpload = async (categoryId) => {
  for (const file of fileList.value) {
    if (file.originFileObj) {
      try {
        const { url } = await productApi.uploadFile(file.originFileObj, 'categories')
        await productApi.updateCategory(categoryId, { icon: url })
      } catch (error) {
        console.error('上传图标失败:', error)
        message.error('上传图标失败')
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
  
  // 如果有上传成功的图片，更新表单中的图标字段
  const successFile = newFileList.find(file => file.status === 'done' && file.response)
  if (successFile && successFile.response && successFile.response.url) {
    formState.icon = successFile.response.url
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
.category-list-container {
  padding: 16px;
}
</style>
