import { productApi } from './productApi'
import { supabase } from './supabase'

/**
 * 全面测试商品和SKU相关功能
 * 包括：商品创建、编辑、SKU创建、编辑、删除等功能
 */
export const testProductSkuFunctions = async () => {
  console.log('===== 开始测试商品和SKU相关功能 =====')
  const testResults = {
    success: [],
    failed: []
  }

  try {
    // 1. 测试创建商品
    console.log('1. 测试创建商品')
    const testProduct = {
      name: '测试商品_' + Date.now(),
      code: 'TEST' + Date.now().toString().slice(-6),
      category_id: null,
      brand_id: null,
      description: '这是一个测试商品',
      price: 99.99,
      status: true
    }
    
    const createResult = await productApi.createProduct(testProduct)
    if (createResult.error) {
      throw new Error('创建商品失败: ' + createResult.error.message)
    }
    
    const productId = createResult.data[0].id
    console.log(`商品创建成功，ID: ${productId}`)
    testResults.success.push('创建商品')
    
    // 2. 测试编辑商品
    console.log('2. 测试编辑商品')
    const updateData = {
      name: testProduct.name + '_已编辑',
      description: '这是一个已编辑的测试商品'
    }
    
    const updateResult = await productApi.updateProduct(productId, updateData)
    if (updateResult.error) {
      throw new Error('编辑商品失败: ' + updateResult.error.message)
    }
    
    console.log('商品编辑成功')
    testResults.success.push('编辑商品')
    
    // 3. 测试创建SKU
    console.log('3. 测试创建SKU')
    const testSku = {
      product_id: productId,
      sku_code: 'SKU' + Date.now().toString().slice(-6),
      spec_info: '颜色:红色;尺寸:XL',
      price: 88.88,
      stock: 100,
      stock_warning: 10,
      status: true
    }
    
    const createSkuResult = await productApi.addProductSku(testSku)
    if (createSkuResult.error) {
      throw new Error('创建SKU失败: ' + createSkuResult.error.message)
    }
    
    const skuId = createSkuResult.data[0].id
    console.log(`SKU创建成功，ID: ${skuId}`)
    testResults.success.push('创建SKU')
    
    // 4. 测试编辑SKU
    console.log('4. 测试编辑SKU')
    const updateSkuData = {
      spec_info: '颜色:蓝色;尺寸:XXL',
      price: 77.77,
      stock: 50
    }
    
    const updateSkuResult = await productApi.updateProductSku(skuId, updateSkuData)
    if (updateSkuResult.error) {
      throw new Error('编辑SKU失败: ' + updateSkuResult.error.message)
    }
    
    console.log('SKU编辑成功')
    testResults.success.push('编辑SKU')
    
    // 5. 测试同步SKU库存
    console.log('5. 测试同步SKU库存')
    const syncResult = await productApi.syncSkuInventory(skuId, 88)
    if (syncResult.error) {
      throw new Error('同步SKU库存失败: ' + syncResult.error.message)
    }
    
    console.log('SKU库存同步成功')
    testResults.success.push('同步SKU库存')
    
    // 6. 测试获取商品SKU列表
    console.log('6. 测试获取商品SKU列表')
    const getSkusResult = await productApi.getProductSkus({ productId })
    if (getSkusResult.error) {
      throw new Error('获取商品SKU列表失败: ' + getSkusResult.error.message)
    }
    
    console.log(`获取到 ${getSkusResult.data.length} 个SKU`)
    testResults.success.push('获取商品SKU列表')
    
    // 7. 测试删除SKU
    console.log('7. 测试删除SKU')
    const deleteSkuResult = await productApi.deleteProductSku(skuId)
    if (deleteSkuResult.error) {
      throw new Error('删除SKU失败: ' + deleteSkuResult.error.message)
    }
    
    console.log('SKU删除成功')
    testResults.success.push('删除SKU')
    
    // 8. 测试删除商品
    console.log('8. 测试删除商品')
    const deleteResult = await productApi.deleteProduct(productId)
    if (deleteResult.error) {
      throw new Error('删除商品失败: ' + deleteResult.error.message)
    }
    
    console.log('商品删除成功')
    testResults.success.push('删除商品')
    
    // 9. 测试数据库表结构
    console.log('9. 测试数据库表结构')
    // 检查product_skus表是否存在
    const { error: tableError } = await supabase
      .from('product_skus')
      .select('id')
      .limit(1)
    
    if (tableError) {
      throw new Error('product_skus表不存在: ' + tableError.message)
    }
    
    // 检查inventory表是否有sku_id字段
    const { data: inventoryColumns } = await supabase.rpc('get_table_columns', { table_name: 'inventory' })
    const hasSkuIdField = inventoryColumns.some(col => col.column_name === 'sku_id')
    
    if (!hasSkuIdField) {
      throw new Error('inventory表缺少sku_id字段')
    }
    
    console.log('数据库表结构正确')
    testResults.success.push('数据库表结构')
    
  } catch (error) {
    console.error('测试过程中出错:', error)
    testResults.failed.push(error.message)
  }
  
  // 输出测试结果
  console.log('\n===== 测试结果 =====')
  console.log(`成功: ${testResults.success.length} 项`)
  testResults.success.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item}`)
  })
  
  console.log(`失败: ${testResults.failed.length} 项`)
  testResults.failed.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item}`)
  })
  
  console.log('===== 测试完成 =====')
  
  return testResults
}

// 添加一个辅助函数，用于检查数据库中是否存在get_table_columns函数
export const ensureRpcFunctions = async () => {
  // 检查是否存在get_table_columns函数
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'products' })
  
  if (error && error.code === 'PGRST301') {
    // 函数不存在，创建它
    console.log('创建get_table_columns函数...')
    
    const { error: createError } = await supabase.rpc('create_get_table_columns_function')
    
    if (createError) {
      console.error('创建get_table_columns函数失败:', createError)
      
      // 尝试直接执行SQL创建函数
      const { error: sqlError } = await supabase.from('_exec_sql').select('*').eq('query', `
        CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
        RETURNS TABLE(column_name text, data_type text)
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT c.column_name::text, c.data_type::text
          FROM information_schema.columns c
          WHERE c.table_name = table_name
          AND c.table_schema = 'public';
        END;
        $$;
      `)
      
      if (sqlError) {
        console.error('直接创建函数失败:', sqlError)
        throw new Error('无法创建必要的数据库函数')
      }
    }
    
    console.log('get_table_columns函数创建成功')
  } else if (error) {
    console.error('检查get_table_columns函数时出错:', error)
    throw error
  } else {
    console.log('get_table_columns函数已存在')
  }
}
