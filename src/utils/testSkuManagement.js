import { productApi } from './productApi'

/**
 * 测试SKU管理页面功能
 * 模拟SKU管理页面的各项操作
 */
export const testSkuManagement = async () => {
  console.log('===== 开始测试SKU管理页面功能 =====')
  const testResults = {
    success: [],
    failed: []
  }

  try {
    // 1. 创建测试商品
    console.log('1. 创建测试商品')
    const testProduct = {
      name: '测试商品_SKU管理_' + Date.now(),
      code: 'TESTMGMT' + Date.now().toString().slice(-6),
      description: '这是一个用于测试SKU管理页面的商品',
      price: 99.99,
      status: true
    }
    
    const createResult = await productApi.createProduct(testProduct)
    if (createResult.error) {
      throw new Error('创建商品失败: ' + createResult.error.message)
    }
    
    const productId = createResult.data[0].id
    console.log(`商品创建成功，ID: ${productId}`)
    testResults.success.push('创建测试商品')
    
    // 2. 测试SKU的添加功能
    console.log('2. 测试SKU的添加功能')
    const newSku = {
      product_id: productId,
      sku_code: 'SKU-TEST-' + Date.now().toString().slice(-6),
      spec_info: '颜色:绿色;尺寸:XXL',
      price: 88.88,
      stock: 100,
      stock_warning: 10,
      status: true
    }
    
    const addResult = await productApi.addProductSku(newSku)
    if (addResult.error) {
      throw new Error('添加SKU失败: ' + addResult.error.message)
    }
    
    const skuId = addResult.data[0].id
    console.log(`SKU添加成功，ID: ${skuId}`)
    testResults.success.push('添加SKU')
    
    // 3. 测试SKU的编辑功能
    console.log('3. 测试SKU的编辑功能')
    const updatedSku = {
      spec_info: '颜色:紫色;尺寸:XXXL',
      price: 77.77,
      stock: 50,
      stock_warning: 5
    }
    
    const updateResult = await productApi.updateProductSku(skuId, updatedSku)
    if (updateResult.error) {
      throw new Error('编辑SKU失败: ' + updateResult.error.message)
    }
    
    console.log('SKU编辑成功')
    testResults.success.push('编辑SKU')
    
    // 4. 测试SKU的查询功能
    console.log('4. 测试SKU的查询功能')
    // 4.1 按商品ID查询
    const queryByProductResult = await productApi.getProductSkus({
      productId: productId
    })
    
    if (queryByProductResult.error) {
      throw new Error('按商品ID查询SKU失败: ' + queryByProductResult.error.message)
    }
    
    if (queryByProductResult.data.length === 0) {
      throw new Error('按商品ID查询SKU结果为空')
    }
    
    console.log(`按商品ID查询成功，找到 ${queryByProductResult.data.length} 个SKU`)
    testResults.success.push('按商品ID查询SKU')
    
    // 4.2 按SKU编码查询
    const queryByCodeResult = await productApi.getProductSkus({
      skuCode: newSku.sku_code
    })
    
    if (queryByCodeResult.error) {
      throw new Error('按SKU编码查询SKU失败: ' + queryByCodeResult.error.message)
    }
    
    if (queryByCodeResult.data.length === 0) {
      throw new Error('按SKU编码查询SKU结果为空')
    }
    
    console.log(`按SKU编码查询成功，找到 ${queryByCodeResult.data.length} 个SKU`)
    testResults.success.push('按SKU编码查询SKU')
    
    // 4.3 按规格信息查询
    const queryBySpecResult = await productApi.getProductSkus({
      specInfo: '紫色'
    })
    
    if (queryBySpecResult.error) {
      throw new Error('按规格信息查询SKU失败: ' + queryBySpecResult.error.message)
    }
    
    console.log(`按规格信息查询成功，找到 ${queryBySpecResult.data.length} 个SKU`)
    testResults.success.push('按规格信息查询SKU')
    
    // 5. 测试SKU库存同步功能
    console.log('5. 测试SKU库存同步功能')
    const syncResult = await productApi.syncSkuInventory(skuId, 88)
    if (syncResult.error) {
      throw new Error('同步SKU库存失败: ' + syncResult.error.message)
    }
    
    console.log('SKU库存同步成功')
    testResults.success.push('同步SKU库存')
    
    // 6. 测试SKU的删除功能
    console.log('6. 测试SKU的删除功能')
    const deleteResult = await productApi.deleteProductSku(skuId)
    if (deleteResult.error) {
      throw new Error('删除SKU失败: ' + deleteResult.error.message)
    }
    
    console.log('SKU删除成功')
    testResults.success.push('删除SKU')
    
    // 7. 清理测试数据
    console.log('7. 清理测试数据')
    const deleteProductResult = await productApi.deleteProduct(productId)
    if (deleteProductResult.error) {
      throw new Error('删除商品失败: ' + deleteProductResult.error.message)
    }
    
    console.log('测试商品删除成功')
    testResults.success.push('清理测试数据')
    
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
