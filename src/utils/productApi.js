import { supabase } from './supabase'

// 商品管理相关方法
export const productApi = {
  // 商品相关方法
  // 获取商品列表
  async getProducts(options = {}) {
    const { page = 1, pageSize = 10, sort, filter, search } = options
    
    let query = supabase
      .from('products')
      .select(`
        *,
        product_category:category_id(id, name),
        product_brand:brand_id(id, name),
        product_images(id, image_url, is_main)
      `, { count: 'exact' })
      .is('deleted_at', null)
    
    // 添加搜索条件
    if (search) {
      query = query.or(`name.ilike.%${search}%,product_code.ilike.%${search}%,description.ilike.%${search}%`)
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
    
    return await query
  },
  
  // 获取单个商品
  async getProductById(id) {
    return await supabase
      .from('products')
      .select(`
        *,
        product_category:category_id(id, name),
        product_brand:brand_id(id, name),
        product_images(id, image_url, alt, sort_order, is_main),
        product_specifications(id, spec_name, spec_value, spec_image, sort_order),
        product_skus(id, sku_code, spec_info, price, stock, image_url, barcode, status),
        product_attribute_values(id, attribute_id, value)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()
  },
  
  // 创建商品
  async createProduct(productData) {
    return await supabase
      .from('products')
      .insert(productData)
      .select()
  },
  
  // 更新商品
  async updateProduct(id, productData) {
    return await supabase
      .from('products')
      .update(productData)
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
    
    // 获取公共URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath)
    
    return { path: filePath, url: publicUrl }
  }
}
