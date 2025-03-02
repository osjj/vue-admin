import productApi from './productApi'
import { supabase } from './supabase'
import { ensureRpcFunctions } from './ensureRpcFunctions'

/**
 * 测试商品表单中的SKU选择功能
 */
export const testProductFormSku = async () => {
  console.log('===== 开始测试商品表单中的SKU选择功能 =====')
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
        console.warn('product_skus表不存在，无法进行商品表单SKU测试');
        testResults.failed.push('product_skus表不存在，请先创建表结构');
        return testResults;
      }
    } catch (e) {
      console.warn('检查product_skus表时出错:', e);
      testResults.failed.push('检查product_skus表时出错: ' + e.message);
      return testResults;
    }

    // 1. 创建测试商品
    console.log('1. 创建测试商品')
    const testProduct = {
      name: '测试商品_表单SKU_' + Date.now(),
      product_code: 'TESTFORM' + Date.now().toString().slice(-6),
      category_id: 1,
      description: '这是一个用于测试商品表单SKU功能的商品',
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
    
    // 2. 为该商品创建多个SKU
    console.log('2. 为商品创建多个SKU')
    const skuData = [
      {
        product_id: productId,
        sku_code: 'SKU-RED-XL-' + Date.now().toString().slice(-6),
        spec_info: '颜色:红色;尺寸:XL',
        price: 88.88,
        stock: 100,
        status: true
      },
      {
        product_id: productId,
        sku_code: 'SKU-BLUE-L-' + Date.now().toString().slice(-6),
        spec_info: '颜色:蓝色;尺寸:L',
        price: 77.77,
        stock: 50,
        status: true
      },
      {
        product_id: productId,
        sku_code: 'SKU-BLACK-M-' + Date.now().toString().slice(-6),
        spec_info: '颜色:黑色;尺寸:M',
        price: 66.66,
        stock: 30,
        status: true
      }
    ]
    
    const createdSkus = []
    
    for (const sku of skuData) {
      const { data, error } = await productApi.addProductSku(sku)
      if (error) {
        throw new Error('创建SKU失败: ' + error.message)
      }
      
      createdSkus.push(data[0])
      console.log(`创建SKU成功: ${sku.sku_code}`)
    }
    
    testResults.success.push('创建多个SKU')
    
    // 3. 测试获取商品的SKU列表
    console.log('3. 测试获取商品的SKU列表')
    const { data: skuList, error: skuListError } = await productApi.getProductSkus({
      productId: productId
    })
    
    if (skuListError) {
      throw new Error('获取SKU列表失败: ' + skuListError.message)
    }
    
    if (skuList.length !== skuData.length) {
      throw new Error(`SKU列表数量不匹配: 期望 ${skuData.length}, 实际 ${skuList.length}`)
    }
    
    console.log(`成功获取到 ${skuList.length} 个SKU`)
    testResults.success.push('获取SKU列表')
    
    // 4. 模拟在商品表单中选择SKU
    console.log('4. 模拟在商品表单中选择SKU')
    // 这里我们只能模拟，因为实际的UI交互需要在浏览器中进行
    const selectedSku = skuList[0]
    console.log(`模拟选择SKU: ${selectedSku.sku_code}`)
    console.log(`应该自动填充规格信息: ${selectedSku.spec_info}`)
    testResults.success.push('模拟选择SKU')
    
    // 5. 清理测试数据
    console.log('5. 清理测试数据')
    // 删除创建的SKU
    for (const sku of createdSkus) {
      const { error } = await productApi.deleteProductSku(sku.id)
      if (error) {
        console.warn(`删除SKU ${sku.id} 失败: ${error.message}`)
      } else {
        console.log(`删除SKU ${sku.id} 成功`)
      }
    }
    
    // 删除测试商品
    const { error: deleteError } = await productApi.deleteProduct(productId)
    if (deleteError) {
      console.warn(`删除商品 ${productId} 失败: ${deleteError.message}`)
    } else {
      console.log(`删除商品 ${productId} 成功`)
    }
    
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
