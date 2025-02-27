<template>
  <a-modal
    :visible="visible"
    :title="isEdit ? '编辑商品' : '添加商品'"
    width="900px"
    @cancel="handleCancel"
    :footer="null"
    :destroyOnClose="true"
  >
    <a-form
      :model="formState"
      :rules="rules"
      ref="formRef"
      layout="vertical"
    >
      <a-tabs v-model:activeKey="activeTab">
        <!-- 基本信息 -->
        <a-tab-pane key="basic" tab="基本信息">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="商品名称" name="name">
                <a-input v-model:value="formState.name" placeholder="请输入商品名称" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="商品编码" name="product_code">
                <a-input v-model:value="formState.product_code" placeholder="请输入商品编码" />
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="商品价格" name="price">
                <a-input-number
                  v-model:value="formState.price"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  placeholder="请输入商品价格"
                  addon-before="¥"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="市场价格" name="market_price">
                <a-input-number
                  v-model:value="formState.market_price"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  placeholder="请输入市场价格"
                  addon-before="¥"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="成本价格" name="cost_price">
                <a-input-number
                  v-model:value="formState.cost_price"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  placeholder="请输入成本价格"
                  addon-before="¥"
                />
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="商品库存" name="stock">
                <a-input-number
                  v-model:value="formState.stock"
                  :min="0"
                  :precision="0"
                  style="width: 100%"
                  placeholder="请输入商品库存"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="库存预警值" name="stock_warning">
                <a-input-number
                  v-model:value="formState.stock_warning"
                  :min="0"
                  :precision="0"
                  style="width: 100%"
                  placeholder="请输入库存预警值"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="排序值" name="sort_order">
                <a-input-number
                  v-model:value="formState.sort_order"
                  :min="0"
                  :precision="0"
                  style="width: 100%"
                  placeholder="请输入排序值"
                />
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="商品分类" name="category_id">
                <a-select
                  v-model:value="formState.category_id"
                  placeholder="请选择商品分类"
                  style="width: 100%"
                >
                  <a-select-option
                    v-for="category in categories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="商品品牌" name="brand_id">
                <a-select
                  v-model:value="formState.brand_id"
                  placeholder="请选择商品品牌"
                  style="width: 100%"
                  allow-clear
                >
                  <a-select-option
                    v-for="brand in brands"
                    :key="brand.id"
                    :value="brand.id"
                  >
                    {{ brand.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="商品重量(kg)" name="weight">
                <a-input-number
                  v-model:value="formState.weight"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  placeholder="请输入商品重量"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="商品体积(m³)" name="volume">
                <a-input-number
                  v-model:value="formState.volume"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  placeholder="请输入商品体积"
                />
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-form-item label="商品描述" name="description">
            <a-textarea
              v-model:value="formState.description"
              :rows="4"
              placeholder="请输入商品描述"
            />
          </a-form-item>
          
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="商品状态" name="status">
                <a-switch
                  v-model:checked="formState.status"
                  :checked-children="'上架'"
                  :un-checked-children="'下架'"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="是否推荐" name="is_featured">
                <a-switch
                  v-model:checked="formState.is_featured"
                  :checked-children="'是'"
                  :un-checked-children="'否'"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="是否新品" name="is_new">
                <a-switch
                  v-model:checked="formState.is_new"
                  :checked-children="'是'"
                  :un-checked-children="'否'"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-tab-pane>
        
        <!-- 图片管理 -->
        <a-tab-pane key="images" tab="图片管理">
          <a-form-item label="主图" name="main_image">
            <a-upload
              v-model:file-list="mainImageFileList"
              list-type="picture-card"
              :show-upload-list="true"
              :before-upload="beforeUpload"
              @preview="handlePreview"
              @change="handleMainImageChange"
              :maxCount="1"
            >
              <div v-if="mainImageFileList.length < 1">
                <plus-outlined />
                <div style="margin-top: 8px">上传</div>
              </div>
            </a-upload>
          </a-form-item>
          
          <a-form-item label="商品图片集" name="images">
            <a-upload
              v-model:file-list="imageFileList"
              list-type="picture-card"
              :show-upload-list="true"
              :before-upload="beforeUpload"
              @preview="handlePreview"
              @change="handleImageChange"
            >
              <div v-if="imageFileList.length < 10">
                <plus-outlined />
                <div style="margin-top: 8px">上传</div>
              </div>
            </a-upload>
          </a-form-item>
          
          <a-form-item label="视频URL" name="video_url">
            <a-input v-model:value="formState.video_url" placeholder="请输入商品视频URL" />
          </a-form-item>
        </a-tab-pane>
        
        <!-- SEO信息 -->
        <a-tab-pane key="seo" tab="SEO信息">
          <a-form-item label="商品关键词" name="keywords">
            <a-input v-model:value="formState.keywords" placeholder="请输入商品关键词，多个关键词用逗号分隔" />
          </a-form-item>
          
          <a-form-item label="商品标签" name="tags">
            <a-select
              v-model:value="formState.tags"
              mode="tags"
              style="width: 100%"
              placeholder="请输入商品标签，回车确认"
              :token-separators="[',']"
            ></a-select>
          </a-form-item>
        </a-tab-pane>
      </a-tabs>
      
      <div class="form-actions">
        <a-space>
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" @click="handleSubmit" :loading="submitting">保存</a-button>
        </a-space>
      </div>
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
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { message, Upload } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { productApi } from '@/utils/productApi'

// 接收的属性
const props = defineProps({
  visible: Boolean,
  product: Object,
  categories: Array,
  brands: Array
})

// 发出的事件
const emit = defineEmits(['update:visible', 'success'])

// 状态变量
const formRef = ref(null)
const activeTab = ref('basic')
const submitting = ref(false)
const mainImageFileList = ref([])
const imageFileList = ref([])
const previewVisible = ref(false)
const previewImage = ref('')

// 是否是编辑模式
const isEdit = computed(() => !!props.product)

// 表单状态
const formState = reactive({
  name: '',
  product_code: '',
  description: '',
  price: 0,
  market_price: null,
  cost_price: null,
  stock: 0,
  stock_warning: 10,
  weight: null,
  volume: null,
  category_id: undefined,
  brand_id: undefined,
  status: false,
  main_image: '',
  video_url: '',
  keywords: '',
  tags: [],
  sort_order: 0,
  is_featured: false,
  is_new: false,
  is_hot: false
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  product_code: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
  price: [{ required: true, type: 'number', message: '请输入商品价格', trigger: 'change' }],
  stock: [{ required: true, type: 'number', message: '请输入商品库存', trigger: 'change' }],
  category_id: [{ required: true, message: '请选择商品分类', trigger: 'change' }]
}

// 监听product变化，初始化表单
watch(
  () => props.product,
  (product) => {
    if (product) {
      // 重置表单
      nextTick(() => {
        formRef.value?.resetFields()
      })
      
      // 填充表单数据
      Object.keys(formState).forEach(key => {
        if (product[key] !== undefined) {
          formState[key] = product[key]
        }
      })
      
      // 处理标签
      if (product.tags) {
        formState.tags = typeof product.tags === 'string' 
          ? product.tags.split(',') 
          : product.tags
      }
      
      // 处理主图
      if (product.main_image) {
        mainImageFileList.value = [{
          uid: '-1',
          name: 'main_image.jpg',
          status: 'done',
          url: product.main_image
        }]
      } else {
        mainImageFileList.value = []
      }
      
      // 处理图片集
      if (product.product_images && product.product_images.length > 0) {
        imageFileList.value = product.product_images.map((img, index) => ({
          uid: img.id || `-${index + 1}`,
          name: `image_${index + 1}.jpg`,
          status: 'done',
          url: img.image_url
        }))
      } else {
        imageFileList.value = []
      }
    } else {
      // 新增模式，重置表单
      nextTick(() => {
        formRef.value?.resetFields()
      })
      mainImageFileList.value = []
      imageFileList.value = []
    }
  },
  { immediate: true }
)

// 处理取消
const handleCancel = () => {
  emit('update:visible', false)
}

// 处理提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    // 准备提交数据
    const formData = { ...formState }
    
    // 处理标签
    if (formData.tags && Array.isArray(formData.tags)) {
      formData.tags = formData.tags.join(',')
    }
    
    // 添加时间戳
    formData.updated_at = new Date().toISOString()
    
    let result
    
    if (isEdit.value) {
      // 更新商品
      result = await productApi.updateProduct(props.product.id, formData)
    } else {
      // 创建商品
      formData.created_at = new Date().toISOString()
      result = await productApi.createProduct(formData)
    }
    
    if (result.error) throw result.error
    
    const productId = isEdit.value ? props.product.id : result.data[0].id
    
    // 处理图片上传
    await handleImageUpload(productId)
    
    message.success(`${isEdit.value ? '更新' : '创建'}商品成功`)
    emit('success')
  } catch (error) {
    console.error(`${isEdit.value ? '更新' : '创建'}商品失败:`, error)
    message.error(`${isEdit.value ? '更新' : '创建'}商品失败: ${error.message || '未知错误'}`)
  } finally {
    submitting.value = false
  }
}

// 处理图片上传
const handleImageUpload = async (productId) => {
  // 处理主图
  for (const file of mainImageFileList.value) {
    if (file.originFileObj) {
      try {
        const { url } = await productApi.uploadFile(file.originFileObj, 'main')
        await productApi.updateProduct(productId, { main_image: url })
      } catch (error) {
        console.error('上传主图失败:', error)
        message.error('上传主图失败')
      }
    }
  }
  
  // 处理图片集
  for (const file of imageFileList.value) {
    if (file.originFileObj) {
      try {
        const { url } = await productApi.uploadFile(file.originFileObj, 'gallery')
        await productApi.addProductImage({
          product_id: productId,
          image_url: url,
          alt: formState.name,
          sort_order: 0,
          is_main: false
        })
      } catch (error) {
        console.error('上传图片失败:', error)
        message.error('上传图片失败')
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

// 处理主图变化
const handleMainImageChange = ({ fileList }) => {
  mainImageFileList.value = fileList
  
  // 如果有上传成功的图片，更新表单中的主图字段
  const successFile = fileList.find(file => file.status === 'done' && file.response)
  if (successFile && successFile.response && successFile.response.url) {
    formState.main_image = successFile.response.url
  }
}

// 处理图片集变化
const handleImageChange = ({ fileList }) => {
  imageFileList.value = fileList
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
.form-actions {
  margin-top: 24px;
  text-align: right;
}
</style>
