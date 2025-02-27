// 商品数据填充脚本
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 尝试从项目根目录读取 .env 文件
let supabaseUrl = process.env.VITE_SUPABASE_URL
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

// 如果环境变量不存在，尝试从 .env 文件读取
if (!supabaseUrl || !supabaseKey) {
  try {
    const envPath = path.resolve(__dirname, '../.env')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envLines = envContent.split('\n')
    
    for (const line of envLines) {
      const [key, value] = line.split('=')
      if (key === 'VITE_SUPABASE_URL') {
        supabaseUrl = value.trim()
      } else if (key === 'VITE_SUPABASE_ANON_KEY') {
        supabaseKey = value.trim()
      }
    }
  } catch (error) {
    console.error('Unable to read .env file:', error)
  }
}

// 如果仍然没有找到配置，提示用户输入
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase configuration not found.')
  console.error('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in the .env file.')
  process.exit(1)
}

// 初始化 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey)

// 示例分类数据
const categories = [
  {
    name: '电子产品',
    code: 'electronics',
    description: '各类电子设备和配件',
    level: 1,
    path: '/electronics',
    sort_order: 1,
    status: true,
    is_featured: true,
    seo_title: '电子产品 - 高品质电子设备和配件',
    seo_keywords: '电子产品,电子设备,配件',
    seo_description: '提供各类高品质电子设备和配件，包括手机、电脑、平板等'
  },
  {
    name: '服装',
    code: 'clothing',
    description: '时尚服装和配饰',
    level: 1,
    path: '/clothing',
    sort_order: 2,
    status: true,
    is_featured: true,
    seo_title: '服装 - 时尚服装和配饰',
    seo_keywords: '服装,时尚,配饰',
    seo_description: '提供各类时尚服装和配饰，包括男装、女装、童装等'
  },
  {
    name: '家居',
    code: 'home',
    description: '家居用品和装饰品',
    level: 1,
    path: '/home',
    sort_order: 3,
    status: true,
    is_featured: true,
    seo_title: '家居 - 家居用品和装饰品',
    seo_keywords: '家居,用品,装饰品',
    seo_description: '提供各类家居用品和装饰品，包括家具、装饰品、厨房用品等'
  },
  {
    name: '手机',
    code: 'mobile',
    description: '各类手机和配件',
    level: 2,
    path: '/electronics/mobile',
    sort_order: 1,
    status: true,
    is_featured: true,
    seo_title: '手机 - 各类手机和配件',
    seo_keywords: '手机,智能手机,手机配件',
    seo_description: '提供各类手机和配件，包括智能手机、手机壳、充电器等'
  },
  {
    name: '电脑',
    code: 'computer',
    description: '各类电脑和配件',
    level: 2,
    path: '/electronics/computer',
    sort_order: 2,
    status: true,
    is_featured: true,
    seo_title: '电脑 - 各类电脑和配件',
    seo_keywords: '电脑,笔记本,台式机,配件',
    seo_description: '提供各类电脑和配件，包括笔记本、台式机、键盘、鼠标等'
  }
]

// 示例品牌数据
const brands = [
  {
    name: 'Apple',
    logo: 'https://placehold.co/200x200?text=Apple',
    description: '美国科技公司，生产iPhone、iPad、Mac等产品',
    company: 'Apple Inc.',
    website: 'https://www.apple.com',
    sort_order: 1,
    status: true,
    is_featured: true,
    country: '美国',
    founded_year: 1976
  },
  {
    name: 'Samsung',
    logo: 'https://placehold.co/200x200?text=Samsung',
    description: '韩国科技公司，生产Galaxy系列手机、电视等产品',
    company: 'Samsung Electronics Co., Ltd.',
    website: 'https://www.samsung.com',
    sort_order: 2,
    status: true,
    is_featured: true,
    country: '韩国',
    founded_year: 1938
  },
  {
    name: 'Nike',
    logo: 'https://placehold.co/200x200?text=Nike',
    description: '美国运动品牌，生产运动鞋、运动服装等产品',
    company: 'Nike, Inc.',
    website: 'https://www.nike.com',
    sort_order: 3,
    status: true,
    is_featured: true,
    country: '美国',
    founded_year: 1964
  },
  {
    name: 'IKEA',
    logo: 'https://placehold.co/200x200?text=IKEA',
    description: '瑞典家居品牌，提供各类家具和家居用品',
    company: 'IKEA Group',
    website: 'https://www.ikea.com',
    sort_order: 4,
    status: true,
    is_featured: true,
    country: '瑞典',
    founded_year: 1943
  },
  {
    name: 'Xiaomi',
    logo: 'https://placehold.co/200x200?text=Xiaomi',
    description: '中国科技公司，生产智能手机、智能家居等产品',
    company: 'Xiaomi Corporation',
    website: 'https://www.mi.com',
    sort_order: 5,
    status: true,
    is_featured: true,
    country: '中国',
    founded_year: 2010
  }
]

// 示例商品数据
const products = [
  {
    product_code: 'P001',
    name: 'iPhone 14 Pro',
    description: 'Apple最新旗舰智能手机，搭载A16仿生芯片',
    price: 8999.00,
    market_price: 9599.00,
    cost_price: 6000.00,
    stock: 100,
    stock_warning: 20,
    weight: 0.2,
    volume: 0.0001,
    category_id: 4, // 手机分类
    brand_id: 1, // Apple品牌
    status: true,
    sales: 50,
    rating: 4.8,
    main_image: 'https://placehold.co/600x400?text=iPhone+14+Pro',
    keywords: 'iPhone,智能手机,Apple',
    tags: '新品,热销,旗舰',
    sort_order: 1,
    is_featured: true,
    is_new: true,
    is_hot: true
  },
  {
    product_code: 'P002',
    name: 'Samsung Galaxy S23',
    description: 'Samsung最新旗舰智能手机，搭载骁龙8 Gen 2处理器',
    price: 7999.00,
    market_price: 8599.00,
    cost_price: 5000.00,
    stock: 80,
    stock_warning: 15,
    weight: 0.18,
    volume: 0.0001,
    category_id: 4, // 手机分类
    brand_id: 2, // Samsung品牌
    status: true,
    sales: 40,
    rating: 4.7,
    main_image: 'https://placehold.co/600x400?text=Samsung+Galaxy+S23',
    keywords: 'Samsung,智能手机,Galaxy',
    tags: '新品,热销,旗舰',
    sort_order: 2,
    is_featured: true,
    is_new: true,
    is_hot: true
  },
  {
    product_code: 'P003',
    name: 'MacBook Pro 14',
    description: 'Apple最新专业笔记本电脑，搭载M2 Pro芯片',
    price: 14999.00,
    market_price: 15999.00,
    cost_price: 10000.00,
    stock: 50,
    stock_warning: 10,
    weight: 1.6,
    volume: 0.002,
    category_id: 5, // 电脑分类
    brand_id: 1, // Apple品牌
    status: true,
    sales: 30,
    rating: 4.9,
    main_image: 'https://placehold.co/600x400?text=MacBook+Pro+14',
    keywords: 'MacBook,笔记本电脑,Apple',
    tags: '新品,热销,专业',
    sort_order: 3,
    is_featured: true,
    is_new: true,
    is_hot: false
  },
  {
    product_code: 'P004',
    name: 'Nike Air Max 270',
    description: 'Nike经典跑鞋，搭载Air Max气垫',
    price: 1299.00,
    market_price: 1499.00,
    cost_price: 600.00,
    stock: 200,
    stock_warning: 30,
    weight: 0.3,
    volume: 0.005,
    category_id: 2, // 服装分类
    brand_id: 3, // Nike品牌
    status: true,
    sales: 100,
    rating: 4.6,
    main_image: 'https://placehold.co/600x400?text=Nike+Air+Max+270',
    keywords: 'Nike,跑鞋,运动鞋',
    tags: '经典,热销,舒适',
    sort_order: 4,
    is_featured: true,
    is_new: false,
    is_hot: true
  },
  {
    product_code: 'P005',
    name: 'IKEA BILLY 书柜',
    description: 'IKEA经典书柜，简约实用',
    price: 599.00,
    market_price: 699.00,
    cost_price: 300.00,
    stock: 150,
    stock_warning: 20,
    weight: 30.0,
    volume: 0.2,
    category_id: 3, // 家居分类
    brand_id: 4, // IKEA品牌
    status: true,
    sales: 80,
    rating: 4.5,
    main_image: 'https://placehold.co/600x400?text=IKEA+BILLY',
    keywords: 'IKEA,书柜,家具',
    tags: '经典,实用,简约',
    sort_order: 5,
    is_featured: true,
    is_new: false,
    is_hot: false
  },
  {
    product_code: 'P006',
    name: 'Xiaomi 13',
    description: 'Xiaomi最新旗舰智能手机，搭载骁龙8 Gen 2处理器',
    price: 4999.00,
    market_price: 5299.00,
    cost_price: 3000.00,
    stock: 120,
    stock_warning: 25,
    weight: 0.19,
    volume: 0.0001,
    category_id: 4, // 手机分类
    brand_id: 5, // Xiaomi品牌
    status: true,
    sales: 60,
    rating: 4.6,
    main_image: 'https://placehold.co/600x400?text=Xiaomi+13',
    keywords: 'Xiaomi,智能手机,小米',
    tags: '新品,热销,旗舰',
    sort_order: 6,
    is_featured: true,
    is_new: true,
    is_hot: true
  }
]

// 示例商品图片数据
const productImages = [
  {
    product_id: 1, // iPhone 14 Pro
    image_url: 'https://placehold.co/600x400?text=iPhone+14+Pro+1',
    alt: 'iPhone 14 Pro 正面图',
    sort_order: 1,
    is_main: true
  },
  {
    product_id: 1, // iPhone 14 Pro
    image_url: 'https://placehold.co/600x400?text=iPhone+14+Pro+2',
    alt: 'iPhone 14 Pro 背面图',
    sort_order: 2,
    is_main: false
  },
  {
    product_id: 2, // Samsung Galaxy S23
    image_url: 'https://placehold.co/600x400?text=Samsung+Galaxy+S23+1',
    alt: 'Samsung Galaxy S23 正面图',
    sort_order: 1,
    is_main: true
  },
  {
    product_id: 2, // Samsung Galaxy S23
    image_url: 'https://placehold.co/600x400?text=Samsung+Galaxy+S23+2',
    alt: 'Samsung Galaxy S23 背面图',
    sort_order: 2,
    is_main: false
  }
]

// 示例商品评论数据
const productReviews = [
  {
    product_id: 1, // iPhone 14 Pro
    user_id: '00000000-0000-0000-0000-000000000001', // 假设的用户ID
    rating: 5,
    content: '非常好用的手机，拍照效果很棒，续航也不错。',
    images: 'https://placehold.co/300x300?text=Review+1',
    status: 1, // 已通过
    is_anonymous: false,
    likes: 10
  },
  {
    product_id: 1, // iPhone 14 Pro
    user_id: '00000000-0000-0000-0000-000000000002', // 假设的用户ID
    rating: 4,
    content: '整体不错，就是价格有点贵。',
    status: 1, // 已通过
    is_anonymous: true,
    likes: 5
  },
  {
    product_id: 2, // Samsung Galaxy S23
    user_id: '00000000-0000-0000-0000-000000000003', // 假设的用户ID
    rating: 5,
    content: '很棒的手机，系统流畅，拍照效果好。',
    images: 'https://placehold.co/300x300?text=Review+3',
    status: 1, // 已通过
    is_anonymous: false,
    likes: 8
  },
  {
    product_id: 3, // MacBook Pro 14
    user_id: '00000000-0000-0000-0000-000000000001', // 假设的用户ID
    rating: 5,
    content: '性能强大，散热好，屏幕显示效果出色。',
    status: 0, // 待审核
    is_anonymous: false,
    likes: 0
  }
]

// 示例评论回复数据
const reviewReplies = [
  {
    review_id: 1, // 对应第一条评论
    user_id: '00000000-0000-0000-0000-000000000010', // 假设的管理员ID
    content: '感谢您的评价，我们会继续努力提供更好的产品。',
    is_admin: true,
    status: true
  },
  {
    review_id: 3, // 对应第三条评论
    user_id: '00000000-0000-0000-0000-000000000010', // 假设的管理员ID
    content: '谢谢您的支持，欢迎再次购买我们的产品。',
    is_admin: true,
    status: true
  }
]

// 插入数据的函数
async function insertData() {
  try {
    console.log('Starting to insert category data...')
    for (const category of categories) {
      const { data, error } = await supabase
        .from('product_categories')
        .insert(category)
        .select()
      
      if (error) throw error
      console.log(`Category ${category.name} inserted successfully, ID: ${data[0].id}`)
    }

    console.log('Starting to insert brand data...')
    for (const brand of brands) {
      const { data, error } = await supabase
        .from('product_brands')
        .insert(brand)
        .select()
      
      if (error) throw error
      console.log(`Brand ${brand.name} inserted successfully, ID: ${data[0].id}`)
    }

    console.log('Starting to insert product data...')
    for (const product of products) {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
      
      if (error) throw error
      console.log(`Product ${product.name} inserted successfully, ID: ${data[0].id}`)
    }

    console.log('Starting to insert product image data...')
    for (const image of productImages) {
      const { error } = await supabase
        .from('product_images')
        .insert(image)
      
      if (error) throw error
    }
    console.log('Product image data inserted successfully')

    console.log('Starting to insert product review data...')
    for (const review of productReviews) {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert(review)
        .select()
      
      if (error) throw error
      console.log(`Review inserted successfully, ID: ${data[0].id}`)
    }

    console.log('Starting to insert review reply data...')
    for (const reply of reviewReplies) {
      const { error } = await supabase
        .from('review_replies')
        .insert(reply)
      
      if (error) throw error
    }
    console.log('Review reply data inserted successfully')

    console.log('All data inserted successfully!')
  } catch (error) {
    console.error('Error inserting data:', error)
  }
}

// 执行插入数据
insertData()
