import productApi from './productApi'
import { supabase } from './supabase'
import { ensureRpcFunctions } from './ensureRpcFunctions'

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
    // 确保RPC函数存在
    await ensureRpcFunctions();
    
    // 检查product_skus表是否存在
    let hasSkuTable = false;
    try {
      const { data, error: tableCheckError } = await supabase
        .from('product_skus')
        .select('*', { count: 'exact', head: true })
        .limit(0);
      
      hasSkuTable = !tableCheckError;
      
      if (!hasSkuTable) {
        console.warn('product_skus表不存在，将跳过SKU相关测试');
        testResults.failed.push('product_skus表不存在，请先创建表结构');
      }
    } catch (e) {
      console.warn('检查product_skus表时出错:', e);
      hasSkuTable = false;
    }

    // 1. 测试创建商品
    console.log('1. 测试创建商品')
    const testProduct = {
      name: '测试商品_' + Date.now(),
      product_code: 'TEST' + Date.now().toString().slice(-6),
      category_id: 1,
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
    
    // 如果SKU表存在，才执行SKU相关测试
    if (hasSkuTable) {
      // 3. 测试创建SKU
      console.log('3. 测试创建SKU')
      const testSku = {
        product_id: productId,
        sku_code: 'SKU' + Date.now().toString().slice(-6),
        spec_info: '颜色:红色;尺寸:XL',
        price: 88.88,
        stock: 100,
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
    } else {
      console.log('跳过SKU相关测试，因为product_skus表不存在');
      testResults.failed.push('SKU相关测试被跳过');
    }
    
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
    
    if (hasSkuTable) {
      // 检查inventory表是否有sku_id字段
      try {
        // 直接检查inventory表是否有sku_id字段，不使用get_table_columns函数
        const { data: skuIdData, error: skuIdError } = await supabase
          .from('inventory')
          .select('sku_id')
          .limit(1);
        
        if (skuIdError && skuIdError.code === '42703') { // 列不存在
          throw new Error('inventory表缺少sku_id字段');
        } else if (skuIdError) {
          console.warn('检查inventory表sku_id字段时出错:', skuIdError);
          testResults.failed.push('检查inventory表结构失败: ' + skuIdError.message);
        } else {
          console.log('inventory表中存在sku_id字段');
          console.log('数据库表结构正确');
          testResults.success.push('数据库表结构');
        }
      } catch (error) {
        console.error('检查表结构时出错:', error);
        testResults.failed.push('检查表结构失败: ' + error.message);
      }
    } else {
      console.log('跳过数据库表结构测试，因为product_skus表不存在');
      testResults.failed.push('数据库表结构测试被跳过');
    }
    
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
