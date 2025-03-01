import { supabase } from './supabase'

class InventoryApi {
  // 获取库存列表
  async getInventoryList(options = {}) {
    try {
      const { page = 1, pageSize = 10, search = '', filter = {} } = options
      
      // 计算分页范围
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      // 构建查询
      let query = supabase
        .from('inventory_view')
        .select('*', { count: 'exact' })
      
      // 应用搜索条件
      if (search) {
        query = query.or(`product_name.ilike.%${search}%,sku_code.ilike.%${search}%`)
      }
      
      // 应用库存状态筛选
      if (filter.inStock) {
        query = query.gt('quantity', 0)
      } else if (filter.lowStock) {
        query = query.gt('quantity', 0).lt('quantity', 10)
      } else if (filter.outOfStock) {
        query = query.eq('quantity', 0)
      }
      
      // 应用商品ID筛选
      if (filter.product_id) {
        query = query.eq('product_id', filter.product_id)
      }
      
      // 应用SKU ID筛选
      if (filter.sku_id) {
        query = query.eq('sku_id', filter.sku_id)
      }
      
      // 应用排序
      if (options.sorter) {
        const { field, order } = options.sorter
        if (field && order) {
          const direction = order === 'ascend' ? 'asc' : 'desc'
          query = query.order(field, { ascending: direction === 'asc' })
        }
      } else {
        // 默认排序
        query = query.order('updated_at', { ascending: false })
      }
      
      // 应用分页
      query = query.range(from, to)
      
      // 执行查询
      const { data, error, count } = await query
      
      if (error) throw error
      
      return { data, count, error: null }
    } catch (error) {
      console.error('获取库存列表失败:', error)
      return { data: [], count: 0, error }
    }
  }
  
  // 根据商品ID获取库存
  async getInventoryByProductId(productId, skuId = null) {
    try {
      let query = supabase
        .from('inventory_view')
        .select('*')
        .eq('product_id', productId)
      
      if (skuId) {
        query = query.eq('sku_id', skuId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error('获取商品库存失败:', error)
      return { data: [], error }
    }
  }
  
  // 创建库存记录
  async createInventory(inventoryData) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert(inventoryData)
        .select()
        .single()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error('创建库存记录失败:', error)
      return { data: null, error }
    }
  }
  
  // 更新库存记录
  async updateInventory(inventoryId, updateData) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', inventoryId)
        .select()
        .single()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error('更新库存记录失败:', error)
      return { data: null, error }
    }
  }
  
  // 调整库存
  async adjustInventory(adjustData) {
    try {
      // 创建库存调整记录
      const { data: logData, error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          product_id: adjustData.product_id,
          sku_id: adjustData.sku_id,
          operation_type: adjustData.operation_type,
          quantity: adjustData.quantity,
          reference_type: adjustData.reference_type || 'manual',
          reference_id: adjustData.reference_id,
          user_id: adjustData.user_id,
          remark: adjustData.remark,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (logError) throw logError
      
      // 获取当前库存记录
      const { data: currentInventory, error: getError } = await this.getInventoryByProductId(
        adjustData.product_id,
        adjustData.sku_id
      )
      
      if (getError) throw getError
      
      let newQuantity = 0
      
      if (currentInventory && currentInventory.length > 0) {
        // 更新现有库存
        const inventory = currentInventory[0]
        
        // 计算新库存数量
        if (adjustData.operation_type === 1) {
          // 入库
          newQuantity = inventory.quantity + adjustData.quantity
        } else if (adjustData.operation_type === 2) {
          // 出库
          newQuantity = Math.max(0, inventory.quantity - adjustData.quantity)
        } else if (adjustData.operation_type === 3) {
          // 直接调整
          newQuantity = adjustData.quantity
        }
        
        // 更新库存记录
        const { data: updatedInventory, error: updateError } = await this.updateInventory(
          inventory.id,
          {
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          }
        )
        
        if (updateError) throw updateError
        
        return { data: updatedInventory, error: null }
      } else {
        // 创建新库存记录
        const { data: newInventory, error: createError } = await this.createInventory({
          product_id: adjustData.product_id,
          sku_id: adjustData.sku_id,
          quantity: adjustData.operation_type === 2 ? 0 : adjustData.quantity,
          locked_quantity: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        if (createError) throw createError
        
        return { data: newInventory, error: null }
      }
    } catch (error) {
      console.error('调整库存失败:', error)
      return { data: null, error }
    }
  }
  
  // 同步商品库存
  async syncProductInventory(productId, stock) {
    // Check for existing inventory record
    const { data: existingInventory } = await this.getInventoryByProductId(productId)
    if (existingInventory && existingInventory.length > 0) {
      // Update existing inventory record
      return await this.updateInventory(existingInventory[0].id, {
        quantity: stock,
        updated_at: new Date().toISOString()
      })
    } else {
      // Create new inventory record
      return await this.createInventory({
        product_id: productId,
        quantity: stock,
        locked_quantity: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }
  
  // 获取库存日志
  async getInventoryLogs(options = {}) {
    try {
      const { page = 1, pageSize = 10, productId, skuId, operationType, startDate, endDate } = options
      
      // 计算分页范围
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      // 构建查询
      let query = supabase
        .from('inventory_logs_view')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
      
      // 应用商品和SKU筛选
      if (productId) {
        query = query.eq('product_id', productId)
      }
      
      if (skuId) {
        query = query.eq('sku_id', skuId)
      }
      
      // 应用操作类型筛选
      if (operationType) {
        query = query.eq('operation_type', operationType)
      }
      
      // 应用日期范围筛选
      if (startDate && endDate) {
        query = query
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`)
      }
      
      // 应用分页
      query = query.range(from, to)
      
      // 执行查询
      const { data, error, count } = await query
      
      if (error) throw error
      
      return { data, count, error: null }
    } catch (error) {
      console.error('获取库存日志失败:', error)
      return { data: [], count: 0, error }
    }
  }
}

export const inventoryApi = new InventoryApi()
