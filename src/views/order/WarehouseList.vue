<template>
  <div class="warehouse-list-container">
    <a-card title="仓库管理" :bordered="false">
      <!-- 搜索和操作区域 -->
      <div class="table-operations">
        <a-space>
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索仓库名称"
            style="width: 250px"
            @search="handleSearch"
            allow-clear
          />
        </a-space>
        <a-space>
          <a-button type="primary" @click="showModal()">
            <template #icon><plus-outlined /></template>
            添加仓库
          </a-button>
          <a-button @click="handleRefresh">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </div>

      <!-- 仓库列表表格 -->
      <a-table
        :columns="columns"
        :data-source="warehouses"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <!-- 自定义列内容 -->
        <template #bodyCell="{ column, record }">
          <!-- 默认仓库 -->
          <template v-if="column.dataIndex === 'is_default'">
            <a-tag v-if="record.is_default" color="green">默认</a-tag>
            <span v-else>-</span>
          </template>
          
          <!-- 仓库状态 -->
          <template v-if="column.dataIndex === 'status'">
            <a-badge :status="record.status ? 'success' : 'error'" :text="record.status ? '启用' : '禁用'" />
          </template>
          
          <!-- 操作 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a @click="showModal(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm
                title="确定要删除此仓库吗?"
                @confirm="handleDelete(record)"
                okText="确定"
                cancelText="取消"
              >
                <a>删除</a>
              </a-popconfirm>
              <a-divider type="vertical" />
              <a v-if="!record.is_default" @click="handleSetDefault(record)">设为默认</a>
              <a v-if="!record.status" @click="handleToggleStatus(record, true)">启用</a>
              <a v-if="record.status" @click="handleToggleStatus(record, false)">禁用</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 仓库表单模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="currentWarehouse ? '编辑仓库' : '添加仓库'"
      @ok="handleSubmit"
      :confirmLoading="confirmLoading"
    >
      <a-form
        :model="warehouseForm"
        :rules="rules"
        ref="formRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="仓库名称" name="name">
          <a-input v-model:value="warehouseForm.name" placeholder="请输入仓库名称" />
        </a-form-item>
        <a-form-item label="仓库地址" name="address">
          <a-textarea v-model:value="warehouseForm.address" placeholder="请输入仓库地址" :rows="3" />
        </a-form-item>
        <a-form-item label="仓库状态" name="status">
          <a-switch v-model:checked="warehouseForm.status" />
        </a-form-item>
        <a-form-item label="默认仓库" name="is_default">
          <a-switch v-model:checked="warehouseForm.is_default" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { supabase } from '@/utils/supabase'
import { formatDateTime } from '@/utils/format'
import { 
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'

// 状态变量
const loading = ref(false)
const modalVisible = ref(false)
const confirmLoading = ref(false)
const warehouses = ref([])
const currentWarehouse = ref(null)
const searchText = ref('')
const formRef = ref(null)

// 仓库表单
const warehouseForm = reactive({
  name: '',
  address: '',
  status: true,
  is_default: false
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入仓库名称', trigger: 'blur' },
    { max: 100, message: '仓库名称不能超过100个字符', trigger: 'blur' }
  ],
  address: [
    { max: 255, message: '仓库地址不能超过255个字符', trigger: 'blur' }
  ]
}

// 表格列定义
const columns = [
  {
    title: '仓库名称',
    dataIndex: 'name',
    ellipsis: true
  },
  {
    title: '仓库地址',
    dataIndex: 'address',
    ellipsis: true
  },
  {
    title: '默认仓库',
    dataIndex: 'is_default',
    width: 100
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 180,
    sorter: true,
    customRender: ({ text }) => {
      return formatDateTime(text)
    }
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 220
  }
]

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条记录`
})

// 获取仓库列表
const fetchWarehouses = async () => {
  loading.value = true
  
  try {
    let query = supabase
      .from('warehouses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(
        (pagination.current - 1) * pagination.pageSize,
        pagination.current * pagination.pageSize - 1
      )
    
    // 应用搜索条件
    if (searchText.value) {
      query = query.ilike('name', `%${searchText.value}%`)
    }
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    warehouses.value = data
    pagination.total = count || 0
  } catch (error) {
    console.error('Error fetching warehouses:', error)
    message.error('获取仓库列表失败')
  } finally {
    loading.value = false
  }
}

// 显示模态框
const showModal = (warehouse = null) => {
  currentWarehouse.value = warehouse
  
  if (warehouse) {
    Object.keys(warehouseForm).forEach(key => {
      warehouseForm[key] = warehouse[key]
    })
  } else {
    // 重置表单
    Object.keys(warehouseForm).forEach(key => {
      warehouseForm[key] = key === 'status' ? true : key === 'is_default' ? false : ''
    })
  }
  
  modalVisible.value = true
  
  // 重置表单验证
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 处理表单提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    confirmLoading.value = true
    
    // 如果设置为默认仓库，需要先将其他仓库设置为非默认
    if (warehouseForm.is_default) {
      await supabase
        .from('warehouses')
        .update({ is_default: false })
        .neq('id', currentWarehouse.value?.id || 0)
    }
    
    if (currentWarehouse.value) {
      // 更新仓库
      const { error } = await supabase
        .from('warehouses')
        .update({
          name: warehouseForm.name,
          address: warehouseForm.address,
          status: warehouseForm.status,
          is_default: warehouseForm.is_default,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentWarehouse.value.id)
      
      if (error) throw error
      
      message.success('仓库更新成功')
    } else {
      // 创建仓库
      const { error } = await supabase
        .from('warehouses')
        .insert({
          name: warehouseForm.name,
          address: warehouseForm.address,
          status: warehouseForm.status,
          is_default: warehouseForm.is_default
        })
      
      if (error) throw error
      
      message.success('仓库添加成功')
    }
    
    modalVisible.value = false
    fetchWarehouses()
  } catch (error) {
    console.error('Error submitting warehouse:', error)
    message.error(currentWarehouse.value ? '更新仓库失败' : '添加仓库失败')
  } finally {
    confirmLoading.value = false
  }
}

// 处理删除仓库
const handleDelete = async (record) => {
  if (record.is_default) {
    message.error('默认仓库不能删除')
    return
  }
  
  try {
    // 检查是否有库存记录
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select('id')
      .eq('warehouse_id', record.id)
      .limit(1)
    
    if (inventoryError) throw inventoryError
    
    if (inventoryData && inventoryData.length > 0) {
      message.error('该仓库存在库存记录，无法删除')
      return
    }
    
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', record.id)
    
    if (error) throw error
    
    message.success('仓库删除成功')
    fetchWarehouses()
  } catch (error) {
    console.error('Error deleting warehouse:', error)
    message.error('删除仓库失败')
  }
}

// 设置默认仓库
const handleSetDefault = async (record) => {
  try {
    // 先将所有仓库设置为非默认
    const { error: updateAllError } = await supabase
      .from('warehouses')
      .update({ is_default: false })
    
    if (updateAllError) throw updateAllError
    
    // 将当前仓库设置为默认
    const { error } = await supabase
      .from('warehouses')
      .update({ is_default: true })
      .eq('id', record.id)
    
    if (error) throw error
    
    message.success('默认仓库设置成功')
    fetchWarehouses()
  } catch (error) {
    console.error('Error setting default warehouse:', error)
    message.error('设置默认仓库失败')
  }
}

// 切换仓库状态
const handleToggleStatus = async (record, status) => {
  try {
    const { error } = await supabase
      .from('warehouses')
      .update({ status })
      .eq('id', record.id)
    
    if (error) throw error
    
    message.success(`仓库${status ? '启用' : '禁用'}成功`)
    fetchWarehouses()
  } catch (error) {
    console.error('Error toggling warehouse status:', error)
    message.error(`仓库${status ? '启用' : '禁用'}失败`)
  }
}

// 处理表格变化（分页、排序、筛选）
const handleTableChange = (pag, filters, sort) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchWarehouses()
}

// 处理搜索
const handleSearch = () => {
  pagination.current = 1
  fetchWarehouses()
}

// 处理刷新
const handleRefresh = () => {
  searchText.value = ''
  fetchWarehouses()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchWarehouses()
})
</script>

<style scoped>
.warehouse-list-container {
  padding: 16px;
}

.table-operations {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
</style>
