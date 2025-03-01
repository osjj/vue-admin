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
  
  // 获取商品库存
  async getInventoryByProductId(productId, skuId = null) {
    try {
      // 检查inventory_view视图是否存在
      let useView = true;
      try {
        const { data, error: viewCheckError } = await supabase
          .from('inventory_view')
          .select('*', { count: 'exact', head: true })
          .limit(0);
        
        useView = !viewCheckError;
      } catch (e) {
        console.warn('检查inventory_view视图时出错:', e);
        useView = false;
      }
      
      if (useView) {
        // 使用视图查询
        let query = supabase
          .from('inventory_view')
          .select('*')
          .eq('product_id', productId);
        
        if (skuId) {
          query = query.eq('sku_id', skuId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return { data, error: null };
      } else {
        // 检查product_skus表是否存在
        let hasSkuTable = false;
        try {
          const { data, error: tableCheckError } = await supabase
            .from('product_skus')
            .select('*', { count: 'exact', head: true })
            .limit(0);
          
          hasSkuTable = !tableCheckError;
        } catch (e) {
          console.warn('检查product_skus表时出错:', e);
        }
        
        // 检查inventory表是否有sku_id字段
        let hasSkuIdField = false;
        try {
          const { data, error: columnsError } = await supabase
            .from('inventory')
            .select('sku_id')
            .limit(1);
          
          hasSkuIdField = !columnsError;
        } catch (e) {
          console.warn('检查inventory表结构时出错:', e);
        }
        
        // 直接查询inventory表和products表
        let query = supabase
          .from('inventory')
          .select(`
            *,
            product:product_id(id, name, image_url)
          `)
          .eq('product_id', productId);
        
        if (skuId && hasSkuIdField) {
          query = query.eq('sku_id', skuId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // 格式化数据以匹配视图格式
        const formattedData = await Promise.all(data.map(async (item) => {
          let skuCode = null;
          let specInfo = null;
          
          // 如果有SKU表和sku_id字段，尝试获取SKU信息
          if (hasSkuTable && hasSkuIdField && item.sku_id) {
            const { data: skuData, error: skuError } = await supabase
              .from('product_skus')
              .select('sku_code, spec_info')
              .eq('id', item.sku_id)
              .maybeSingle();
            
            if (!skuError && skuData) {
              skuCode = skuData.sku_code;
              specInfo = skuData.spec_info;
            }
          }
          
          return {
            id: item.id,
            product_id: item.product_id,
            sku_id: item.sku_id || null,
            quantity: item.quantity,
            product_name: item.product?.name || '未知商品',
            product_image: item.product?.image_url || null,
            sku_code: skuCode,
            spec_info: specInfo,
            updated_at: item.updated_at
          };
        }));
        
        return { data: formattedData, error: null };
      }
    } catch (error) {
      console.error('获取商品库存失败:', error);
      return { data: [], error };
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
  async syncProductInventory(productId, stock, skuInfo = {}) {
    try {
      const { sku_code, spec_info } = skuInfo;
      let skuId = null;
      
      // 如果提供了SKU编码，检查是否存在或创建
      if (sku_code) {
        // 检查product_skus表是否存在
        let hasSkuTable = false;
        try {
          const { data, error: tableCheckError } = await supabase.rpc('exec_sql', {
            query: `
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'product_skus'
              );
            `
          });
          
          hasSkuTable = !tableCheckError && data && data.length > 0 && data[0].exists;
        } catch (e) {
          console.warn('检查product_skus表时出错:', e);
        }
        
        // 如果表不存在，则忽略SKU处理
        if (!hasSkuTable) {
          console.warn('product_skus表不存在，跳过SKU处理');
        } else {
          // 检查现有SKU
          const { data: existingSku } = await supabase
            .from('product_skus')
            .select('id')
            .eq('product_id', productId)
            .eq('sku_code', sku_code)
            .maybeSingle();
          
          if (existingSku) {
            skuId = existingSku.id;
            // 更新SKU
            await supabase
              .from('product_skus')
              .update({ 
                spec_info: spec_info || '',
                stock: stock,
                updated_at: new Date().toISOString()
              })
              .eq('id', skuId);
          } else {
            // 创建新SKU
            const { data: newSku, error } = await supabase
              .from('product_skus')
              .insert({
                product_id: productId,
                sku_code: sku_code,
                spec_info: spec_info || '',
                price: 0, // 默认价格
                stock: stock,
                status: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
              
            if (!error && newSku) {
              skuId = newSku.id;
            }
          }
        }
      }
      
      // 检查现有库存记录
      const { data: existingInventory } = await this.getInventoryByProductId(productId);
      
      // 检查inventory表是否有sku_id字段
      let hasSkuIdField = false;
      try {
        const { data, error: columnsError } = await supabase.rpc('exec_sql', {
          query: `
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'inventory'
              AND column_name = 'sku_id'
            );
          `
        });
        
        hasSkuIdField = !columnsError && data && data.length > 0 && data[0].exists;
      } catch (e) {
        console.warn('检查inventory表结构时出错:', e);
      }
      
      if (existingInventory && existingInventory.length > 0) {
        // 更新现有库存记录
        const updateData = {
          quantity: stock,
          updated_at: new Date().toISOString()
        };
        
        // 如果有sku_id字段且有skuId，则更新
        if (hasSkuIdField && skuId) {
          updateData.sku_id = skuId;
        }
        
        return await this.updateInventory(existingInventory[0].id, updateData);
      } else {
        // 创建新库存记录
        const inventoryData = {
          product_id: productId,
          quantity: stock,
          locked_quantity: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // 如果有sku_id字段且有skuId，则添加
        if (hasSkuIdField && skuId) {
          inventoryData.sku_id = skuId;
        }
        
        return await this.createInventory(inventoryData);
      }
    } catch (error) {
      console.error('同步库存失败:', error);
      return { data: null, error };
    }
  }
  
  // 获取库存日志
  async getInventoryLogs(options = {}) {
    try {
      const { page = 1, pageSize = 10, productId, skuId, operationType, startDate, endDate } = options
      
      // 计算分页范围
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      // 检查inventory_logs_view视图是否存在
      let useView = true;
      try {
        const { data, error: viewCheckError } = await supabase
          .from('inventory_logs_view')
          .select('*', { count: 'exact', head: true })
          .limit(0);
        
        useView = !viewCheckError;
      } catch (e) {
        console.warn('检查inventory_logs_view视图时出错:', e);
        useView = false;
      }
      
      if (useView) {
        // 使用视图查询
        let query = supabase
          .from('inventory_logs_view')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });
        
        // 应用商品和SKU筛选
        if (productId) {
          query = query.eq('product_id', productId);
        }
        
        if (skuId) {
          query = query.eq('sku_id', skuId);
        }
        
        // 应用操作类型筛选
        if (operationType) {
          query = query.eq('operation_type', operationType);
        }
        
        // 应用日期范围筛选
        if (startDate && endDate) {
          query = query
            .gte('created_at', `${startDate}T00:00:00`)
            .lte('created_at', `${endDate}T23:59:59`);
        }
        
        // 应用分页
        query = query.range(from, to);
        
        // 执行查询
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return { data, count, error: null };
      } else {
        // 直接查询inventory_logs表
        let query = supabase
          .from('inventory_logs')
          .select(`
            *,
            user:user_id(id, email, display_name),
            product:product_id(id, name)
          `, { count: 'exact' })
          .order('created_at', { ascending: false });
        
        // 应用商品筛选
        if (productId) {
          query = query.eq('product_id', productId);
        }
        
        // 应用操作类型筛选
        if (operationType) {
          query = query.eq('operation_type', operationType);
        }
        
        // 应用日期范围筛选
        if (startDate && endDate) {
          query = query
            .gte('created_at', `${startDate}T00:00:00`)
            .lte('created_at', `${endDate}T23:59:59`);
        }
        
        // 应用分页
        query = query.range(from, to);
        
        // 执行查询
        const { data, error, count } = await query;
        
        if (error) throw error;
        
        // 格式化数据以匹配视图格式
        const formattedData = data.map(item => ({
          id: item.id,
          operation_type: item.operation_type,
          quantity: item.quantity,
          reference_type: item.reference_type,
          reference_id: item.reference_id,
          user_id: item.user_id,
          user_name: item.user?.display_name || null,
          user_email: item.user?.email || null,
          order_id: item.order_id,
          order_no: null, // 没有订单号信息
          remark: item.remark,
          created_at: item.created_at,
          product_id: item.product_id,
          product_name: item.product?.name || '未知商品',
          sku_id: null, // 没有SKU信息
          sku_code: null // 没有SKU代码信息
        }));
        
        return { data: formattedData, count, error: null };
      }
    } catch (error) {
      console.error('获取库存日志失败:', error);
      return { data: [], count: 0, error };
    }
  }
}

export const inventoryApi = new InventoryApi()
