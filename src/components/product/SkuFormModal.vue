<template>
  <a-modal
    :visible="visible"
    :title="isEdit ? '编辑SKU' : '添加SKU'"
    width="700px"
    @cancel="handleCancel"
    :footer="null"
    :destroyOnClose="true"
    @update:visible="handleUpdateVisible"
  >
    <a-form
      :model="formState"
      :rules="rules"
      ref="formRef"
      layout="vertical"
    >
      <!-- 商品选择 -->
      <a-form-item label="关联商品" name="product_id">
        <a-select
          v-model:value="formState.product_id"
          placeholder="请选择关联商品"
          :loading="productsLoading"
          :filter-option="filterProductOption"
          show-search
          @change="handleProductChange"
        >
          <a-select-option v-for="item in productOptions" :key="item.id" :value="item.id">
            {{ item.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="SKU编码" name="sku_code">
            <a-input v-model:value="formState.sku_code" placeholder="请输入SKU编码" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="规格信息" name="spec_info">
            <a-input v-model:value="formState.spec_info" placeholder="请输入规格信息，如：颜色:红色;尺寸:XL" />
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="价格" name="price">
            <a-input-number
              v-model:value="formState.price"
              :min="0"
              :precision="2"
              style="width: 100%"
              placeholder="请输入价格"
              addon-after="元"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="库存" name="stock">
            <a-input-number
              v-model:value="formState.stock"
              :min="0"
              style="width: 100%"
              placeholder="请输入库存"
              addon-after="件"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="库存预警值" name="stock_warning">
            <a-input-number
              v-model:value="formState.stock_warning"
              :min="0"
              style="width: 100%"
              placeholder="请输入库存预警值"
              addon-after="件"
            />
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="条形码" name="barcode">
            <a-input v-model:value="formState.barcode" placeholder="请输入条形码" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="状态" name="status">
            <a-switch v-model:checked="formState.status" />
          </a-form-item>
        </a-col>
      </a-row>
      
      <!-- SKU图片 -->
      <a-form-item label="SKU图片" name="image_url">
        <a-upload
          v-model:file-list="fileList"
          list-type="picture-card"
          :customRequest="customRequest"
          :before-upload="beforeUpload"
          @preview="handlePreview"
          :maxCount="1"
        >
          <div v-if="fileList.length < 1">
            <plus-outlined />
            <div style="margin-top: 8px">上传</div>
          </div>
        </a-upload>
      </a-form-item>
      
      <div class="form-actions">
        <a-space>
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" :loading="submitting" @click="handleSubmit">保存</a-button>
        </a-space>
      </div>
    </a-form>
    
    <!-- 图片预览模态框 -->
    <a-modal
      v-model:visible="previewVisible"
      :title="previewTitle"
      :footer="null"
      @cancel="handlePreviewCancel"
    >
      <img alt="预览图片" style="width: 100%" :src="previewImage" />
    </a-modal>
  </a-modal>
</template>

<script>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { supabase, getFileUrl } from '../../utils/supabase'
import productApi from '../../utils/productApi'

export default {
  components: {
    PlusOutlined
  },
  props: {
    visible: Boolean,
    sku: Object
  },
  emits: ['update:visible', 'success'],
  setup(props, { emit }) {
    // 状态变量
    const formRef = ref(null)
    const submitting = ref(false)
    const productsLoading = ref(false)
    const productOptions = ref([])
    const fileList = ref([])
    const previewVisible = ref(false)
    const previewImage = ref('')
    const previewTitle = ref('')

    // 是否是编辑模式
    const isEdit = computed(() => !!props.sku)

    // 表单状态
    const formState = reactive({
      product_id: undefined,
      sku_code: '',
      spec_info: '',
      price: 0,
      stock: 0,
      stock_warning: 0,
      barcode: '',
      image_url: '',
      status: true
    })

    // 表单验证规则
    const rules = {
      product_id: [
        { required: true, message: '请选择关联商品', trigger: 'change' }
      ],
      sku_code: [
        { required: true, message: '请输入SKU编码', trigger: 'blur' },
        { min: 2, max: 50, message: 'SKU编码长度在2-50个字符之间', trigger: 'blur' }
      ],
      spec_info: [
        { max: 200, message: '规格信息不能超过200个字符', trigger: 'blur' }
      ],
      price: [
        { required: true, message: '请输入价格', trigger: 'blur' },
        { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
      ],
      stock: [
        { required: true, message: '请输入库存', trigger: 'blur' },
        { type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' }
      ]
    }

    // 监听sku变化，初始化表单
    watch(
      () => props.sku,
      async (sku) => {
        if (sku) {
          // 重置表单
          nextTick(() => {
            formRef.value?.resetFields()
          })
          
          // 填充表单数据
          Object.keys(formState).forEach(key => {
            if (sku[key] !== undefined) {
              formState[key] = sku[key]
            }
          })
          
          // 处理图片
          if (sku.image_url) {
            // 获取签名URL用于预览
            let imageUrl = await getFileUrl(sku.image_url)
            
            fileList.value = [{
              uid: '-1',
              name: 'sku_image.jpg',
              status: 'done',
              url: imageUrl,
              // 保存原始路径用于表单提交
              response: { url: sku.image_url }
            }]
          } else {
            fileList.value = []
          }
        } else {
          // 新建时重置表单
          nextTick(() => {
            formRef.value?.resetFields()
          })
          fileList.value = []
        }
      },
      { immediate: true }
    )

    // 监听visible变化，加载商品选项
    watch(
      () => props.visible,
      (visible) => {
        if (visible) {
          loadProducts()
        }
      },
      { immediate: true }
    )

    // 加载商品选项
    const loadProducts = async () => {
      if (productOptions.value.length > 0) return
      
      productsLoading.value = true
      try {
        const { data, error } = await productApi.getProducts({
          pageSize: 1000,
          includeDeleted: false
        })
        
        if (error) throw error
        
        productOptions.value = data || []
      } catch (error) {
        console.error('获取商品列表失败:', error)
        message.error('获取商品列表失败')
      } finally {
        productsLoading.value = false
      }
    }

    // 商品选择过滤
    const filterProductOption = (input, option) => {
      return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
    }

    // 处理商品变化
    const handleProductChange = (productId) => {
      // 如果是编辑模式且已经有SKU编码和规格信息，则不自动生成
      if (isEdit.value && formState.sku_code) return
      
      // 获取选中的商品
      const selectedProduct = productOptions.value.find(p => p.id === productId)
      if (!selectedProduct) return
      
      // 自动生成SKU编码
      if (!formState.sku_code) {
        // 生成SKU编码，例如：P123-001
        const productCode = selectedProduct.code || `P${productId}`
        const timestamp = new Date().getTime().toString().slice(-6)
        formState.sku_code = `${productCode}-${timestamp}`
      }
    }

    // 处理取消
    const handleCancel = () => {
      emit('update:visible', false)
      resetForm()
    }

    // 处理更新visible
    const handleUpdateVisible = (visible) => {
      emit('update:visible', visible)
    }

    // 处理提交
    const handleSubmit = async () => {
      try {
        // 表单验证
        await formRef.value.validate()
        
        submitting.value = true
        
        // 处理图片URL
        if (fileList.value.length > 0 && fileList.value[0].response && fileList.value[0].response.url) {
          formState.image_url = await getFileUrl(fileList.value[0].response.url)
        }
        
        // 提交表单
        const skuData = { ...formState }
        
        let result
        if (isEdit.value) {
          // 更新SKU
          result = await productApi.updateProductSku(props.sku.id, skuData)
        } else {
          // 创建SKU
          skuData.created_at = new Date().toISOString()
          result = await productApi.addProductSku(skuData)
        }
        
        if (result.error) throw result.error
        
        message.success(`${isEdit.value ? '更新' : '创建'}SKU成功`)
        emit('success')
        handleCancel()
      } catch (error) {
        console.error(`${isEdit.value ? '更新' : '创建'}SKU失败:`, error)
        message.error(`${isEdit.value ? '更新' : '创建'}SKU失败: ${error.message || '未知错误'}`)
      } finally {
        submitting.value = false
      }
    }

    // 自定义上传请求
    const customRequest = async ({ file, onSuccess, onError }) => {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `sku_${Date.now()}.${fileExt}`
        const filePath = `sku_images/${fileName}`
        
        // 上传到Supabase存储
        const { data, error } = await supabase.storage
          .from('products')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (error) throw error
        
        // 只保存文件路径，不保存完整URL
        onSuccess({ url: filePath })
      } catch (error) {
        console.error('上传图片失败:', error)
        onError(error)
        message.error('上传图片失败')
      }
    }

    // 上传前验证
    const beforeUpload = (file) => {
      // 检查文件类型
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件!')
        return false
      }
      
      // 检查文件大小
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error('图片大小不能超过2MB!')
        return false
      }
      
      return true
    }

    // 处理图片预览
    const handlePreview = async (file) => {
      // 无论是否是http开头的URL，都通过getFileUrl处理
      if (file.url) {
        previewImage.value = await getFileUrl(file.url)
      } else if (file.response && file.response.url) {
        previewImage.value = await getFileUrl(file.response.url)
      } else {
        previewImage.value = file.preview || ''
      }
      
      previewVisible.value = true
    }

    // 处理预览关闭
    const handlePreviewCancel = () => {
      previewVisible.value = false
    }

    // 重置表单
    const resetForm = () => {
      formRef.value?.resetFields()
      fileList.value = []
    }

    return {
      formRef,
      formState,
      rules,
      isEdit,
      submitting,
      productsLoading,
      productOptions,
      fileList,
      previewVisible,
      previewImage,
      previewTitle,
      handleCancel,
      handleUpdateVisible,
      handleSubmit,
      handleProductChange,
      filterProductOption,
      customRequest,
      beforeUpload,
      handlePreview,
      handlePreviewCancel,
      resetForm
    }
  }
}
</script>

<style scoped>
.form-actions {
  margin-top: 24px;
  text-align: right;
}
</style>
