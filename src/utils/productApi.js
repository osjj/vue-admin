import { supabase } from './supabase'

// 商品管理相关方法
const productApi = {
  // 商品相关方法
  // 获取商品列表
  async getProducts(options = {}) {
    const { page = 1, pageSize = 10, sort, filter, search } = options
    
    try {
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
      
      // 构建查询
      let query = supabase
        .from('products')
        .select(`
          *,
          product_category:category_id(id, name),
          product_brand:brand_id(id, name),
          product_images(id, image_url, is_main)
          ${hasSkuTable ? ', product_skus(id, sku_code, spec_info)' : ''}
        `, { count: 'exact' })
        .is('deleted_at', null)
      
      // 添加搜索条件
      if (search) {
        let searchQuery = `name.ilike.%${search}%,product_code.ilike.%${search}%,description.ilike.%${search}%`;
        
        // 如果SKU表存在，添加SKU搜索
        if (hasSkuTable) {
          searchQuery += `,product_skus.sku_code.ilike.%${search}%`;
        }
        
        query = query.or(searchQuery);
      }
      
      // 添加过滤条件
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value)
          }
        })
      }
      
      // 添加排序
      if (sort && sort.field) {
        query = query.order(sort.field, { ascending: sort.order === 'ascend' })
      } else {
        query = query.order('created_at', { ascending: false })
      }
      
      // 分页
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
      
      // 执行查询
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // 处理数据
      const processedData = data.map(product => {
        // 找到主图片，如果存在
        let mainImage = product.main_image || null;
        
        // 如果没有主图片但有图片集，尝试从图片集中获取
        if (!mainImage && product.product_images && product.product_images.length > 0) {
          // 首先尝试找到标记为主图的图片
          const mainImageObj = product.product_images.find(img => img.is_main === true);
          if (mainImageObj) {
            mainImage = mainImageObj.image_url;
          } else {
            // 如果没有标记为主图的，使用第一张图片
            mainImage = product.product_images[0].image_url;
          }
        }
        
        return {
          ...product,
          main_image: mainImage
        };
      });
      return { data: processedData, error, count };
    } catch (error) {
      console.error('获取商品列表失败:', error);
      return { data: [], error, count: 0 };
    }
  },
  
  // 获取单个商品
  async getProductById(id) {
    try {
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
      
      // 构建查询
      const query = supabase
        .from('products')
        .select(`
          *,
          product_category:category_id(id, name),
          product_brand:brand_id(id, name),
          product_images(id, image_url, alt, sort_order, is_main),
          product_specifications(id, spec_name, spec_value, spec_image, sort_order),
          ${hasSkuTable ? 'product_skus(id, sku_code, spec_info, price, stock, image_url, barcode, status),' : ''}
          product_attribute_values(id, attribute_id, value)
        `)
        .eq('id', id)
        .is('deleted_at', null);
      
      // 使用 maybeSingle() 而不是 single()，这样如果没有找到记录也不会抛出错误
      const { data, error } = await query.maybeSingle();
      
      if (error) throw error;
      
      // 处理SKU数据
      if (data && data.product_skus && data.product_skus.length > 0) {
        // 使用第一个SKU的信息
        const primarySku = data.product_skus[0];
        data.sku_code = primarySku.sku_code;
        data.spec_info = primarySku.spec_info;
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('获取商品详情失败:', error);
      return { data: null, error };
    }
  },
  
  // 创建商品
  async createProduct(productData) {
    // 如果传入了sku_code字段，需要将其移除，因为products表中没有这个字段
    const { sku_code, ...productDataWithoutSkuCode } = productData;
    
    return await supabase
      .from('products')
      .insert(productDataWithoutSkuCode)
      .select()
  },
  
  // 更新商品
  async updateProduct(id, productData) {
    // 如果传入了sku_code字段，需要将其移除
    const { sku_code, ...productDataWithoutSkuCode } = productData;
    
    return await supabase
      .from('products')
      .update(productDataWithoutSkuCode)
      .eq('id', id)
      .select()
  },
  
  // 删除商品（软删除）
  async deleteProduct(id) {
    return await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
  },
  
  // 商品图片相关方法
  async addProductImage(imageData) {
    return await supabase
      .from('product_images')
      .insert(imageData)
      .select()
  },
  
  async updateProductImage(id, imageData) {
    return await supabase
      .from('product_images')
      .update(imageData)
      .eq('id', id)
      .select()
  },
  
  async deleteProductImage(id) {
    return await supabase
      .from('product_images')
      .delete()
      .eq('id', id)
  },
  
  // 商品规格相关方法
  async addProductSpecification(specData) {
    return await supabase
      .from('product_specifications')
      .insert(specData)
      .select()
  },
  
  async updateProductSpecification(id, specData) {
    return await supabase
      .from('product_specifications')
      .update(specData)
      .eq('id', id)
      .select()
  },
  
  async deleteProductSpecification(id) {
    return await supabase
      .from('product_specifications')
      .delete()
      .eq('id', id)
  },
  
  // 商品SKU相关方法
  async getProductSkus(options = {}) {
    const { page = 1, pageSize = 10, sort, productId, productName, skuCode, specInfo } = options
    
    try {
      // 构建查询
      let query = supabase
        .from('product_skus')
        .select(`
          *,
          products!product_skus_product_id_fkey(id, name)
        `, { count: 'exact' })
      
      // 添加商品ID过滤
      if (productId) {
        query = query.eq('product_id', productId)
      }
      
      // 添加SKU编码过滤
      if (skuCode) {
        query = query.ilike('sku_code', `%${skuCode}%`)
      }
      
      // 添加规格信息过滤
      if (specInfo) {
        query = query.ilike('spec_info', `%${specInfo}%`)
      }
      
      // 添加商品名称过滤
      if (productName) {
        query = query.filter('products.name', 'ilike', `%${productName}%`)
      }
      
      // 添加排序
      if (sort) {
        const { field, order } = sort
        if (field && order) {
          query = query.order(field, { ascending: order === 'ascend' })
        }
      } else {
        // 默认按创建时间降序排序
        query = query.order('created_at', { ascending: false })
      }
      
      // 分页
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      const { data, error, count } = await query.range(from, to)
      
      if (error) throw error
      
      // 处理返回数据，将嵌套的商品信息提取出来
      const processedData = data.map(item => {
        const product = item.products || {}
        return {
          ...item,
          product_name: product.name || '未知商品',
          products: undefined // 移除嵌套对象
        }
      })
      
      return { data: processedData, count, error: null }
    } catch (error) {
      console.error('获取SKU列表失败:', error)
      return { data: [], count: 0, error }
    }
  },
  
  async addProductSku(skuData) {
    return await supabase
      .from('product_skus')
      .insert(skuData)
      .select()
  },
  
  async updateProductSku(id, skuData) {
    return await supabase
      .from('product_skus')
      .update(skuData)
      .eq('id', id)
      .select()
  },
  
  async deleteProductSku(id) {
    return await supabase
      .from('product_skus')
      .delete()
      .eq('id', id)
  },
  
  async syncSkuInventory(skuId, quantity) {
    try {
      // 获取SKU信息
      const { data: skuData, error: skuError } = await supabase
        .from('product_skus')
        .select('*')
        .eq('id', skuId)
        .single()
      
      if (skuError) throw skuError
      
      // 检查inventory表中是否已有该SKU的记录
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', skuData.product_id)
        .eq('sku_id', skuId)
        .maybeSingle()
      
      if (inventoryError && inventoryError.code !== 'PGRST116') throw inventoryError
      
      let result
      
      if (inventoryData) {
        // 更新库存记录
        const diffQuantity = quantity - inventoryData.quantity
        
        result = await supabase
          .from('inventory')
          .update({
            quantity: quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', inventoryData.id)
        
        // 如果库存有变化，记录库存日志
        if (diffQuantity !== 0) {
          await supabase
            .from('inventory_logs')
            .insert({
              product_id: skuData.product_id,
              sku_id: skuId,
              operation_type: diffQuantity > 0 ? 1 : 3, // 1: 入库, 3: 调整
              quantity: diffQuantity,
              remark: '通过SKU管理调整库存',
              created_at: new Date().toISOString()
            })
        }
      } else {
        // 创建新的库存记录
        result = await supabase
          .from('inventory')
          .insert({
            product_id: skuData.product_id,
            sku_id: skuId,
            quantity: quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        // 记录库存日志
        if (quantity > 0) {
          await supabase
            .from('inventory_logs')
            .insert({
              product_id: skuData.product_id,
              sku_id: skuId,
              operation_type: 1, // 1: 入库
              quantity: quantity,
              remark: '通过SKU管理初始化库存',
              created_at: new Date().toISOString()
            })
        }
      }
      
      // 同时更新SKU表中的库存字段
      await supabase
        .from('product_skus')
        .update({
          stock: quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', skuId)
      
      return { error: null }
    } catch (error) {
      console.error('同步SKU库存失败:', error)
      return { error }
    }
  },
  
  // 商品分类相关方法
  async getCategories(options = {}) {
    const { includeDeleted = false } = options
    
    let query = supabase
      .from('product_categories')
      .select('*')
    
    if (!includeDeleted) {
      query = query.is('deleted_at', null)
    }
    
    return await query.order('sort_order', { ascending: true })
  },
  
  async getCategoryById(id) {
    return await supabase
      .from('product_categories')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
  },
  
  async createCategory(categoryData) {
    return await supabase
      .from('product_categories')
      .insert(categoryData)
      .select()
  },
  
  async updateCategory(id, categoryData) {
    return await supabase
      .from('product_categories')
      .update(categoryData)
      .eq('id', id)
      .select()
  },
  
  async deleteCategory(id) {
    return await supabase
      .from('product_categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
  },
  
  // 商品品牌相关方法
  async getBrands(options = {}) {
    const { includeDeleted = false } = options
    
    let query = supabase
      .from('product_brands')
      .select('*')
    
    if (!includeDeleted) {
      query = query.is('deleted_at', null)
    }
    
    return await query.order('sort_order', { ascending: true })
  },
  
  async getBrandById(id) {
    return await supabase
      .from('product_brands')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
  },
  
  async createBrand(brandData) {
    return await supabase
      .from('product_brands')
      .insert(brandData)
      .select()
  },
  
  async updateBrand(id, brandData) {
    return await supabase
      .from('product_brands')
      .update(brandData)
      .eq('id', id)
      .select()
  },
  
  async deleteBrand(id) {
    return await supabase
      .from('product_brands')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
  },
  
  // 品牌分类关联相关方法
  async getBrandCategories(brandId) {
    return await supabase
      .from('brand_category_relations')
      .select(`
        *,
        category:category_id(id, name)
      `)
      .eq('brand_id', brandId)
  },
  
  async addBrandCategory(relationData) {
    return await supabase
      .from('brand_category_relations')
      .insert(relationData)
      .select()
  },
  
  async deleteBrandCategory(id) {
    return await supabase
      .from('brand_category_relations')
      .delete()
      .eq('id', id)
  },
  
  // 商品评论相关方法
  async getReviews(options = {}) {
    const { page = 1, pageSize = 10, productId, status, sort } = options
    
    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        product:product_id(id, name, main_image),
        replies:review_replies(*)
      `, { count: 'exact' })
      .is('deleted_at', null)
    
    if (productId) {
      query = query.eq('product_id', productId)
    }
    
    if (status !== undefined) {
      query = query.eq('status', status)
    }
    
    // 添加排序
    if (sort && sort.field) {
      query = query.order(sort.field, { ascending: sort.order === 'ascend' })
    } else {
      query = query.order('created_at', { ascending: false })
    }
    
    // 分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    return await query
  },
  
  async getReviewById(id) {
    return await supabase
      .from('product_reviews')
      .select(`
        *,
        product:product_id(id, name, main_image),
        replies:review_replies(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()
  },
  
  async updateReviewStatus(id, status) {
    return await supabase
      .from('product_reviews')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
  },
  
  async deleteReview(id) {
    return await supabase
      .from('product_reviews')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
  },
  
  // 评论回复相关方法
  async addReviewReply(replyData) {
    return await supabase
      .from('review_replies')
      .insert(replyData)
      .select()
  },
  
  async updateReviewReply(id, replyData) {
    return await supabase
      .from('review_replies')
      .update(replyData)
      .eq('id', id)
      .select()
  },
  
  async deleteReviewReply(id) {
    return await supabase
      .from('review_replies')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
  },
  
  // 敏感词相关方法
  async getSensitiveWords() {
    return await supabase
      .from('sensitive_words')
      .select('*')
      .eq('status', true)
      .order('level', { ascending: false })
  },
  
  // 商品属性相关方法
  async getAttributes(categoryId = null) {
    let query = supabase
      .from('product_attributes')
      .select('*')
      .eq('status', true)
    
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    
    return await query.order('sort_order', { ascending: true })
  },
  
  // 上传文件到存储桶
  async uploadFile(file, path) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = `${path}/${fileName}`
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, file)
    
    if (error) {
      throw error
    }
    
    // 只返回文件路径，不返回完整URL
    return { path: filePath, url: filePath }
  }
}

export default productApi
export { productApi }
