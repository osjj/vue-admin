<template>
  <div class="order-list-container">
    <a-card title="订单列表" :bordered="false">
      <!-- 搜索和过滤区域 -->
      <div class="table-operations">
        <a-space>
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索订单号/收件人"
            style="width: 250px"
            @search="handleSearch"
            allow-clear
          />
          <a-range-picker
            v-model:value="dateRange"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            @change="handleSearch"
          />
          <a-select
            v-model:value="filterStatus"
            placeholder="订单状态"
            style="width: 150px"
            allow-clear
            @change="handleSearch"
          >
            <a-select-option :value="0">待支付</a-select-option>
            <a-select-option :value="1">已支付</a-select-option>
            <a-select-option :value="2">已发货</a-select-option>
            <a-select-option :value="3">已完成</a-select-option>
            <a-select-option :value="4">已取消</a-select-option>
          </a-select>
        </a-space>
        <a-space>
          <a-button @click="handleRefresh">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </div>

      <!-- 订单列表表格 -->
      <a-table
        :columns="columns"
        :data-source="orders"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <!-- 自定义列内容 -->
        <template #bodyCell="{ column, record }">
          <!-- 订单号 -->
          <template v-if="column.dataIndex === 'order_no'">
            <a @click="showOrderDetail(record)">{{ record.order_no }}</a>
          </template>
          
          <!-- 订单状态 -->
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          
          <!-- 收件信息 -->
          <template v-if="column.dataIndex === 'recipient_name'">
            <div>
              <div>{{ record.recipient_name }}</div>
              <div class="text-muted">{{ record.recipient_phone }}</div>
              <div class="text-muted address-ellipsis">{{ record.recipient_address }}</div>
            </div>
          </template>
          
          <!-- 操作 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a @click="showOrderDetail(record)">详情</a>
              <template v-if="record.status === 0">
                <a-divider type="vertical" />
                <a-popconfirm
                  title="确定要取消此订单吗?"
                  @confirm="handleCancelOrder(record)"
                >
                  <a>取消</a>
                </a-popconfirm>
              </template>
              <template v-if="record.status === 1">
                <a-divider type="vertical" />
                <a @click="showShipmentModal(record)">发货</a>
              </template>
              <template v-if="record.status === 2">
                <a-divider type="vertical" />
                <a-popconfirm
                  title="确认将订单标记为已完成吗?"
                  @confirm="handleCompleteOrder(record)"
                  okText="确定"
                  cancelText="取消"
                >
                  <a>完成订单</a>
                </a-popconfirm>
              </template>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 订单详情抽屉 -->
    <a-drawer
      v-model:visible="detailVisible"
      title="订单详情"
      width="600"
      placement="right"
    >
      <template v-if="currentOrder">
        <a-descriptions title="基本信息" bordered :column="1">
          <a-descriptions-item label="订单编号">{{ currentOrder.order_no }}</a-descriptions-item>
          <a-descriptions-item label="订单状态">
            <a-tag :color="getStatusColor(currentOrder.status)">
              {{ getStatusText(currentOrder.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="下单时间">{{ formatDateTime(currentOrder.created_at) }}</a-descriptions-item>
          <a-descriptions-item label="支付时间" v-if="currentOrder.payment_time">
            {{ formatDateTime(currentOrder.payment_time) }}
          </a-descriptions-item>
          <a-descriptions-item label="支付方式" v-if="currentOrder.payment_method">
            {{ currentOrder.payment_method }}
          </a-descriptions-item>
          <a-descriptions-item label="发货时间" v-if="currentOrder.shipping_time">
            {{ formatDateTime(currentOrder.shipping_time) }}
          </a-descriptions-item>
          <a-descriptions-item label="物流单号" v-if="currentOrder.tracking_number">
            {{ currentOrder.tracking_number }}
          </a-descriptions-item>
          <a-descriptions-item label="完成时间" v-if="currentOrder.completion_time">
            {{ formatDateTime(currentOrder.completion_time) }}
          </a-descriptions-item>
          <a-descriptions-item label="买家备注" v-if="currentOrder.buyer_note">
            {{ currentOrder.buyer_note }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider />

        <a-descriptions title="收货信息" bordered :column="1">
          <a-descriptions-item label="收货人">{{ currentOrder.recipient_name }}</a-descriptions-item>
          <a-descriptions-item label="联系电话">{{ currentOrder.recipient_phone }}</a-descriptions-item>
          <a-descriptions-item label="收货地址">{{ currentOrder.recipient_address }}</a-descriptions-item>
        </a-descriptions>

        <a-divider />

        <div class="order-items-title">订单商品</div>
        <a-table
          :columns="itemColumns"
          :data-source="orderItems"
          :pagination="false"
          :loading="itemsLoading"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <!-- 商品图片 -->
            <template v-if="column.dataIndex === 'product_image'">
              <a-image
                :src="record.product_image || 'https://via.placeholder.com/60x60?text=No+Image'"
                :width="60"
                height="60"
                :preview="true"
                fallback="https://via.placeholder.com/60x60?text=Error"
              />
            </template>
            
            <!-- 商品信息 -->
            <template v-if="column.dataIndex === 'product_name'">
              <div>
                <div>{{ record.product_name }}</div>
                <div class="text-muted" v-if="record.spec_info">{{ record.spec_info }}</div>
              </div>
            </template>
          </template>
        </a-table>

        <a-divider />

        <div class="order-summary">
          <div class="summary-item">
            <span>商品总价：</span>
            <span class="price">¥{{ calculateItemsTotal() }}</span>
          </div>
          <div class="summary-item">
            <span>运费：</span>
            <span class="price">¥{{ currentOrder.shipping_fee }}</span>
          </div>
          <div class="summary-item total">
            <span>订单总价：</span>
            <span class="price">¥{{ currentOrder.total_amount }}</span>
          </div>
        </div>
      </template>
    </a-drawer>

    <!-- 发货表单模态框 -->
    <a-modal
      v-model:visible="shipmentModalVisible"
      title="订单发货"
      @ok="handleShipOrder"
      :confirmLoading="confirmLoading"
      width="550px"
    >
      <a-form :model="shipmentForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="订单编号">
          <span>{{ currentOrder?.order_no }}</span>
        </a-form-item>
        <a-form-item label="物流公司" name="logistics_company" :rules="[{ required: true, message: '请选择物流公司' }]">
          <a-select
            v-model:value="shipmentForm.logistics_company"
            placeholder="请选择物流公司"
            :options="logisticsCompanies"
          />
        </a-form-item>
        <a-form-item label="物流单号" name="tracking_number" :rules="[{ required: true, message: '请输入物流单号' }]">
          <a-input v-model:value="shipmentForm.tracking_number" placeholder="请输入物流单号" />
        </a-form-item>
        <a-form-item label="发货仓库" name="warehouse_id" :rules="[{ required: true, message: '请选择发货仓库' }]">
          <a-select
            v-model:value="shipmentForm.warehouse_id"
            placeholder="请选择发货仓库"
            :loading="warehousesLoading"
            :options="warehouseOptions"
            @change="handleWarehouseChange"
          />
        </a-form-item>
        <a-form-item label="备注" name="shipping_note">
          <a-textarea v-model:value="shipmentForm.shipping_note" placeholder="可选：添加发货备注" :rows="2" />
        </a-form-item>
      </a-form>
      <div class="shipment-order-items">
        <div class="shipment-title">订单商品</div>
        <a-table
          :columns="[
            { title: '商品', dataIndex: 'product_name', ellipsis: true },
            { title: '规格', dataIndex: 'spec_info', width: 120 },
            { title: '数量', dataIndex: 'quantity', width: 80 }
          ]"
          :data-source="orderItems"
          :pagination="false"
          size="small"
          :scroll="{ y: 150 }"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, h } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { supabase } from '@/utils/supabase'
import { formatDateTime } from '@/utils/format'
import { 
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons-vue'

// 状态变量
const loading = ref(false)
const itemsLoading = ref(false)
const orders = ref([])
const orderItems = ref([])
const currentOrder = ref(null)
const detailVisible = ref(false)
const shipmentModalVisible = ref(false)
const confirmLoading = ref(false)
const searchText = ref('')
const filterStatus = ref(undefined)
const dateRange = ref(null)
const shipmentForm = reactive({
  logistics_company: '',
  tracking_number: '',
  warehouse_id: undefined,
  shipping_note: ''
})
const logisticsCompanies = ref([
  { value: '顺丰', label: '顺丰' },
  { value: '圆通', label: '圆通' },
  { value: '中通', label: '中通' },
  { value: '申通', label: '申通' },
  { value: '韵达', label: '韵达' },
  { value: '天天', label: '天天' },
  { value: 'EMS', label: 'EMS' },
  { value: '其他', label: '其他' }
])
const warehousesLoading = ref(false)
const warehouseOptions = ref([])

// 表格列定义
const columns = [
  {
    title: '订单号',
    dataIndex: 'order_no',
    width: 180,
    sorter: true
  },
  {
    title: '订单状态',
    dataIndex: 'status',
    width: 120
  },
  {
    title: '收件人信息',
    dataIndex: 'recipient_name',
    width: 200
  },
  {
    title: '订单金额',
    dataIndex: 'total_amount',
    width: 120,
    sorter: true,
    customRender: ({ text }) => {
      return `¥${text}`
    }
  },
  {
    title: '下单时间',
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
    width: 150
  }
]

// 订单商品表格列定义
const itemColumns = [
  {
    title: '商品图片',
    dataIndex: 'product_image',
    width: 80
  },
  {
    title: '商品信息',
    dataIndex: 'product_name',
    ellipsis: true
  },
  {
    title: '单价',
    dataIndex: 'price',
    width: 100,
    customRender: ({ text }) => {
      return `¥${text}`
    }
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    width: 80
  },
  {
    title: '小计',
    dataIndex: 'total_price',
    width: 120,
    customRender: ({ text }) => {
      return `¥${text}`
    }
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

// 排序配置
const sorter = ref({
  field: 'created_at',
  order: 'descend'
})

// 获取订单状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '待支付',
    1: '已支付',
    2: '已发货',
    3: '已完成',
    4: '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 获取订单状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    0: 'orange',
    1: 'blue',
    2: 'purple',
    3: 'green',
    4: 'red'
  }
  return colorMap[status] || 'default'
}

// 计算订单商品总价
const calculateItemsTotal = () => {
  return orderItems.value.reduce((total, item) => total + Number(item.total_price), 0).toFixed(2)
}

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  
  try {
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order(sorter.value.field, { ascending: sorter.value.order === 'ascend' })
      .range(
        (pagination.current - 1) * pagination.pageSize,
        pagination.current * pagination.pageSize - 1
      )
    
    // 应用搜索条件
    if (searchText.value) {
      query = query.or(`order_no.ilike.%${searchText.value}%,recipient_name.ilike.%${searchText.value}%,recipient_phone.ilike.%${searchText.value}%`)
    }
    
    // 应用状态过滤
    if (filterStatus.value !== undefined) {
      query = query.eq('status', filterStatus.value)
    }
    
    // 应用日期范围过滤
    if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
      const startDate = dateRange.value[0].format('YYYY-MM-DD') + 'T00:00:00'
      const endDate = dateRange.value[1].format('YYYY-MM-DD') + 'T23:59:59'
      query = query.gte('created_at', startDate).lte('created_at', endDate)
    }
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    orders.value = data
    pagination.total = count || 0
  } catch (error) {
    console.error('Error fetching orders:', error)
    message.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 获取订单商品
const fetchOrderItems = async (orderId) => {
  itemsLoading.value = true
  
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('id')
    
    if (error) throw error
    
    orderItems.value = data
  } catch (error) {
    console.error('Error fetching order items:', error)
    message.error('获取订单商品失败')
  } finally {
    itemsLoading.value = false
  }
}

// 处理表格变化（分页、排序、筛选）
const handleTableChange = (pag, filters, sort) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  
  if (sort && sort.field && sort.order) {
    sorter.value.field = sort.field
    sorter.value.order = sort.order
  }
  
  fetchOrders()
}

// 处理搜索
const handleSearch = () => {
  pagination.current = 1
  fetchOrders()
}

// 处理刷新
const handleRefresh = () => {
  fetchOrders()
}

// 显示订单详情
const showOrderDetail = (record) => {
  currentOrder.value = record
  fetchOrderItems(record.id)
  detailVisible.value = true
}

// 显示发货模态框
const showShipmentModal = (record) => {
  currentOrder.value = record
  shipmentForm.logistics_company = ''
  shipmentForm.tracking_number = ''
  shipmentForm.warehouse_id = undefined
  shipmentForm.shipping_note = ''
  shipmentModalVisible.value = true
  fetchWarehouses()
}

// 处理取消订单
const handleCancelOrder = async (record) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: 4 })
      .eq('id', record.id)
    
    if (error) throw error
    
    message.success('订单已取消')
    fetchOrders()
  } catch (error) {
    console.error('Error canceling order:', error)
    message.error('取消订单失败')
  }
}

// 处理订单发货
const handleShipOrder = async () => {
  if (!shipmentForm.logistics_company || !shipmentForm.tracking_number || !shipmentForm.warehouse_id) {
    message.error('请填写物流公司、物流单号和发货仓库')
    return
  }
  
  confirmLoading.value = true
  
  try {
    // 1. 获取订单商品信息
    const { data: orderItemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, sku_id, quantity')
      .eq('order_id', currentOrder.value.id)
    
    if (itemsError) throw itemsError
    
    // 2. 检查订单状态是否为已支付（状态为1）
    const { data: orderData, error: orderCheckError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', currentOrder.value.id)
      .single()
    
    if (orderCheckError) throw orderCheckError
    
    if (orderData.status !== 1) {
      message.error('只有已支付的订单才能发货')
      confirmLoading.value = false
      return
    }
    
    // 3. 更新订单状态为已发货
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 2,
        tracking_number: shipmentForm.tracking_number,
        shipping_time: new Date().toISOString(),
        logistics_company: shipmentForm.logistics_company,
        warehouse_id: shipmentForm.warehouse_id,
        shipping_note: shipmentForm.shipping_note
      })
      .eq('id', currentOrder.value.id)
    
    if (orderError) throw orderError
    
    // 4. 使用选择的仓库ID
    const warehouseId = shipmentForm.warehouse_id
    
    // 尝试更新库存，但不影响订单发货流程
    try {
      if (warehouseId) {
        let inventoryUpdateSuccess = true;
        let updatedItemsCount = 0;
        let inventoryErrors = [];
        
        // 5. 更新库存数量
        for (const item of orderItemsData) {
          // 构建查询条件
          const inventoryQuery = supabase
            .from('inventory')
            .select('id, quantity, locked_quantity')
            .eq('warehouse_id', warehouseId)
            .eq('product_id', item.product_id)
          
          // 如果有SKU，添加SKU条件
          if (item.sku_id) {
            inventoryQuery.eq('sku_id', item.sku_id)
          } else {
            inventoryQuery.is('sku_id', null)
          }
          
          const { data: inventoryData, error: inventoryError } = await inventoryQuery.single()
          
          if (inventoryError) {
            console.error('Error fetching inventory:', inventoryError)
            inventoryErrors.push(`商品ID ${item.product_id} 的库存信息获取失败`)
            continue
          }
          
          if (!inventoryData) {
            inventoryErrors.push(`商品ID ${item.product_id} 在仓库中不存在库存记录`)
            continue
          }
          
          // 检查锁定库存是否足够
          if (inventoryData.locked_quantity < item.quantity) {
            inventoryErrors.push(`商品ID ${item.product_id} 的锁定库存不足，需要 ${item.quantity}，实际锁定 ${inventoryData.locked_quantity}`)
            continue
          }
          
          // 减少锁定库存，实际出库
          const { error: updateError } = await supabase
            .from('inventory')
            .update({
              locked_quantity: inventoryData.locked_quantity - item.quantity
            })
            .eq('id', inventoryData.id)
          
          if (updateError) {
            console.error('Error updating inventory:', updateError)
            inventoryErrors.push(`商品ID ${item.product_id} 的库存更新失败`)
            continue
          }
          
          // 添加库存日志
          const { error: logError } = await supabase
            .from('inventory_logs')
            .insert({
              product_id: item.product_id,
              sku_id: item.sku_id,
              operation_type: 2, // 出库
              quantity: -item.quantity,
              reference_type: 'order',
              reference_id: currentOrder.value.id,
              user_id: (await supabase.auth.getUser()).data.user?.id,
              warehouse_id: warehouseId // 添加仓库ID
            })
            
          if (logError) {
            console.error('Error creating inventory log:', logError)
            inventoryErrors.push(`商品ID ${item.product_id} 的库存日志创建失败`)
          }
          
          updatedItemsCount++;
        }
        
        if (updatedItemsCount > 0) {
          message.success(`成功更新 ${updatedItemsCount} 个商品的库存`);
          
          if (inventoryErrors.length > 0) {
            // 显示部分成功的警告
            Modal.warning({
              title: '部分商品库存更新失败',
              content: h('div', [
                h('p', '以下商品的库存更新失败：'),
                h('ul', inventoryErrors.map((err, index) => 
                  h('li', { key: index }, err)
                ))
              ]),
            });
          }
        } else if (orderItemsData.length > 0) {
          // 显示所有失败的错误
          Modal.error({
            title: '库存更新失败',
            content: h('div', [
              h('p', '订单发货成功，但所有商品的库存更新均失败：'),
              h('ul', inventoryErrors.map((err, index) => 
                h('li', { key: index }, err)
              ))
            ]),
          });
        }
      } else {
        message.warning('未找到仓库，无法更新库存');
      }
    } catch (inventoryError) {
      // 记录库存更新错误，但不影响订单发货流程
      console.error('Error updating inventory during shipment:', inventoryError)
      message.warning('订单发货成功，但库存更新过程中发生错误');
    }
    
    // 6. 发送发货通知（可以在这里添加通知逻辑）
    
    message.success('订单已发货')
    shipmentModalVisible.value = false
    fetchOrders() // 刷新订单列表
  } catch (error) {
    console.error('Error shipping order:', error)
    message.error(`订单发货失败: ${error.message || '未知错误'}`)
  } finally {
    confirmLoading.value = false
  }
}

// 处理订单完成
const handleCompleteOrder = async (record) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: 3, completion_time: new Date().toISOString() })
      .eq('id', record.id)
    
    if (error) throw error
    
    message.success('订单已完成')
    fetchOrders()
  } catch (error) {
    console.error('Error completing order:', error)
    message.error('订单完成失败')
  }
}

// 获取仓库列表
const fetchWarehouses = async () => {
  warehousesLoading.value = true
  
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('id, name')
      .order('id')
    
    if (error) throw error
    
    warehouseOptions.value = data.map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name
    }))
  } catch (error) {
    console.error('Error fetching warehouses:', error)
    message.error('获取仓库列表失败')
  } finally {
    warehousesLoading.value = false
  }
}

// 处理仓库选择变化
const handleWarehouseChange = (value) => {
  shipmentForm.warehouse_id = value
}

// 组件挂载时获取数据
onMounted(() => {
  fetchOrders()
  fetchOrderStats()
})

// 订单统计变量
const orderStats = reactive({
  total: 0,
  unpaid: 0,
  unshipped: 0,
  today: 0
})

// 获取订单统计数据
const fetchOrderStats = async () => {
  try {
    // 获取总订单数
    const { count: total, error: totalError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) throw totalError
    
    // 获取待支付订单数
    const { count: unpaid, error: unpaidError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 0)
    
    if (unpaidError) throw unpaidError
    
    // 获取待发货订单数
    const { count: unshipped, error: unshippedError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 1)
    
    if (unshippedError) throw unshippedError
    
    // 获取今日订单数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: todayCount, error: todayError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
    
    if (todayError) throw todayError
    
    // 更新统计数据
    orderStats.total = total || 0
    orderStats.unpaid = unpaid || 0
    orderStats.unshipped = unshipped || 0
    orderStats.today = todayCount || 0
  } catch (error) {
    console.error('Error fetching order stats:', error)
  }
}
</script>

<style scoped>
.order-list-container {
  padding: 16px;
}

.table-operations {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.text-muted {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

.address-ellipsis {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-items-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.order-summary {
  text-align: right;
  padding: 16px 0;
}

.summary-item {
  margin-bottom: 8px;
}

.summary-item.total {
  font-weight: bold;
  font-size: 16px;
  margin-top: 16px;
}

.price {
  color: #f5222d;
  margin-left: 8px;
}

.shipment-order-items {
  margin-top: 16px;
}

.shipment-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

/* 统计卡片样式 */
.stat-card {
  border-radius: 4px;
  overflow: hidden;
}

.stat-title {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

.stat-content {
  display: flex;
  align-items: baseline;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
  margin-right: 4px;
}

.stat-unit {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
