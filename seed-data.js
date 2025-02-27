// Product Data Seeding Script
import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Ask for Supabase credentials
rl.question('Enter Supabase URL: ', (supabaseUrl) => {
  rl.question('Enter Supabase Anon Key: ', async (supabaseKey) => {
    try {
      // Initialize Supabase client
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Example category data
      const categories = [
        {
          name: 'Electronics',
          code: 'electronics',
          description: 'Electronic devices and accessories',
          level: 1,
          path: '/electronics',
          sort_order: 1,
          status: true,
          is_featured: true
        },
        {
          name: 'Clothing',
          code: 'clothing',
          description: 'Fashion clothing and accessories',
          level: 1,
          path: '/clothing',
          sort_order: 2,
          status: true,
          is_featured: true
        },
        {
          name: 'Home',
          code: 'home',
          description: 'Home goods and decorations',
          level: 1,
          path: '/home',
          sort_order: 3,
          status: true,
          is_featured: true
        },
        {
          name: 'Mobile Phones',
          code: 'mobile',
          description: 'Mobile phones and accessories',
          level: 2,
          path: '/electronics/mobile',
          sort_order: 1,
          status: true,
          is_featured: true,
          parent_id: 1 // Will be updated after insertion
        },
        {
          name: 'Computers',
          code: 'computer',
          description: 'Computers and accessories',
          level: 2,
          path: '/electronics/computer',
          sort_order: 2,
          status: true,
          is_featured: true,
          parent_id: 1 // Will be updated after insertion
        }
      ]

      // Example brand data
      const brands = [
        {
          name: 'Apple',
          logo: 'https://placehold.co/200x200?text=Apple',
          description: 'American technology company',
          company: 'Apple Inc.',
          website: 'https://www.apple.com',
          sort_order: 1,
          status: true,
          is_featured: true,
          country: 'USA',
          founded_year: 1976
        },
        {
          name: 'Samsung',
          logo: 'https://placehold.co/200x200?text=Samsung',
          description: 'Korean technology company',
          company: 'Samsung Electronics Co., Ltd.',
          website: 'https://www.samsung.com',
          sort_order: 2,
          status: true,
          is_featured: true,
          country: 'South Korea',
          founded_year: 1938
        },
        {
          name: 'Nike',
          logo: 'https://placehold.co/200x200?text=Nike',
          description: 'American sportswear brand',
          company: 'Nike, Inc.',
          website: 'https://www.nike.com',
          sort_order: 3,
          status: true,
          is_featured: true,
          country: 'USA',
          founded_year: 1964
        },
        {
          name: 'IKEA',
          logo: 'https://placehold.co/200x200?text=IKEA',
          description: 'Swedish furniture brand',
          company: 'IKEA Group',
          website: 'https://www.ikea.com',
          sort_order: 4,
          status: true,
          is_featured: true,
          country: 'Sweden',
          founded_year: 1943
        },
        {
          name: 'Xiaomi',
          logo: 'https://placehold.co/200x200?text=Xiaomi',
          description: 'Chinese technology company',
          company: 'Xiaomi Corporation',
          website: 'https://www.mi.com',
          sort_order: 5,
          status: true,
          is_featured: true,
          country: 'China',
          founded_year: 2010
        }
      ]

      // Insert data function
      async function insertData() {
        console.log('Starting to insert category data...')
        const categoryIds = []
        
        // Insert categories
        for (const category of categories) {
          // Remove parent_id for initial insert if it exists
          const { parent_id, ...categoryData } = category
          
          const { data, error } = await supabase
            .from('product_categories')
            .insert(categoryData)
            .select()
          
          if (error) throw error
          console.log(`Category ${category.name} inserted successfully, ID: ${data[0].id}`)
          categoryIds.push(data[0].id)
        }
        
        // Update parent_id for subcategories
        if (categoryIds.length >= 5) {
          // Update Mobile Phones category
          const { error: error1 } = await supabase
            .from('product_categories')
            .update({ parent_id: categoryIds[0] })
            .eq('id', categoryIds[3])
          
          if (error1) throw error1
          
          // Update Computers category
          const { error: error2 } = await supabase
            .from('product_categories')
            .update({ parent_id: categoryIds[0] })
            .eq('id', categoryIds[4])
          
          if (error2) throw error2
          
          console.log('Updated parent_id for subcategories')
        }

        console.log('Starting to insert brand data...')
        const brandIds = []
        
        // Insert brands
        for (const brand of brands) {
          const { data, error } = await supabase
            .from('product_brands')
            .insert(brand)
            .select()
          
          if (error) throw error
          console.log(`Brand ${brand.name} inserted successfully, ID: ${data[0].id}`)
          brandIds.push(data[0].id)
        }

        // Example products data
        const products = [
          {
            product_code: 'P001',
            name: 'iPhone 14 Pro',
            description: 'Apple\'s latest flagship smartphone with A16 Bionic chip',
            price: 8999.00,
            market_price: 9599.00,
            cost_price: 6000.00,
            stock: 100,
            stock_warning: 20,
            weight: 0.2,
            volume: 0.0001,
            category_id: categoryIds[3], // Mobile Phones category
            brand_id: brandIds[0], // Apple brand
            status: true,
            sales: 50,
            rating: 4.8,
            main_image: 'https://placehold.co/600x400?text=iPhone+14+Pro',
            keywords: 'iPhone,smartphone,Apple',
            tags: 'new,hot,flagship',
            sort_order: 1,
            is_featured: true,
            is_new: true,
            is_hot: true
          },
          {
            product_code: 'P002',
            name: 'Samsung Galaxy S23',
            description: 'Samsung\'s latest flagship smartphone with Snapdragon 8 Gen 2',
            price: 7999.00,
            market_price: 8599.00,
            cost_price: 5000.00,
            stock: 80,
            stock_warning: 15,
            weight: 0.18,
            volume: 0.0001,
            category_id: categoryIds[3], // Mobile Phones category
            brand_id: brandIds[1], // Samsung brand
            status: true,
            sales: 40,
            rating: 4.7,
            main_image: 'https://placehold.co/600x400?text=Samsung+Galaxy+S23',
            keywords: 'Samsung,smartphone,Galaxy',
            tags: 'new,hot,flagship',
            sort_order: 2,
            is_featured: true,
            is_new: true,
            is_hot: true
          },
          {
            product_code: 'P003',
            name: 'MacBook Pro 14',
            description: 'Apple\'s latest professional laptop with M2 Pro chip',
            price: 14999.00,
            market_price: 15999.00,
            cost_price: 10000.00,
            stock: 50,
            stock_warning: 10,
            weight: 1.6,
            volume: 0.002,
            category_id: categoryIds[4], // Computers category
            brand_id: brandIds[0], // Apple brand
            status: true,
            sales: 30,
            rating: 4.9,
            main_image: 'https://placehold.co/600x400?text=MacBook+Pro+14',
            keywords: 'MacBook,laptop,Apple',
            tags: 'new,professional',
            sort_order: 3,
            is_featured: true,
            is_new: true,
            is_hot: false
          },
          {
            product_code: 'P004',
            name: 'Nike Air Max 270',
            description: 'Nike classic running shoes with Air Max cushioning',
            price: 1299.00,
            market_price: 1499.00,
            cost_price: 600.00,
            stock: 200,
            stock_warning: 30,
            weight: 0.3,
            volume: 0.005,
            category_id: categoryIds[1], // Clothing category
            brand_id: brandIds[2], // Nike brand
            status: true,
            sales: 100,
            rating: 4.6,
            main_image: 'https://placehold.co/600x400?text=Nike+Air+Max+270',
            keywords: 'Nike,running shoes,sports',
            tags: 'classic,comfortable',
            sort_order: 4,
            is_featured: true,
            is_new: false,
            is_hot: true
          },
          {
            product_code: 'P005',
            name: 'IKEA BILLY Bookcase',
            description: 'IKEA classic bookcase, simple and practical',
            price: 599.00,
            market_price: 699.00,
            cost_price: 300.00,
            stock: 150,
            stock_warning: 20,
            weight: 30.0,
            volume: 0.2,
            category_id: categoryIds[2], // Home category
            brand_id: brandIds[3], // IKEA brand
            status: true,
            sales: 80,
            rating: 4.5,
            main_image: 'https://placehold.co/600x400?text=IKEA+BILLY',
            keywords: 'IKEA,bookcase,furniture',
            tags: 'classic,practical,simple',
            sort_order: 5,
            is_featured: true,
            is_new: false,
            is_hot: false
          },
          {
            product_code: 'P006',
            name: 'Xiaomi 13',
            description: 'Xiaomi\'s latest flagship smartphone with Snapdragon 8 Gen 2',
            price: 4999.00,
            market_price: 5299.00,
            cost_price: 3000.00,
            stock: 120,
            stock_warning: 25,
            weight: 0.19,
            volume: 0.0001,
            category_id: categoryIds[3], // Mobile Phones category
            brand_id: brandIds[4], // Xiaomi brand
            status: true,
            sales: 60,
            rating: 4.6,
            main_image: 'https://placehold.co/600x400?text=Xiaomi+13',
            keywords: 'Xiaomi,smartphone',
            tags: 'new,hot,flagship',
            sort_order: 6,
            is_featured: true,
            is_new: true,
            is_hot: true
          }
        ]

        console.log('Starting to insert product data...')
        const productIds = []
        
        // Insert products
        for (const product of products) {
          const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
          
          if (error) throw error
          console.log(`Product ${product.name} inserted successfully, ID: ${data[0].id}`)
          productIds.push(data[0].id)
        }

        // Example product images
        const productImages = [
          {
            product_id: productIds[0], // iPhone 14 Pro
            image_url: 'https://placehold.co/600x400?text=iPhone+14+Pro+1',
            alt: 'iPhone 14 Pro Front View',
            sort_order: 1,
            is_main: true
          },
          {
            product_id: productIds[0], // iPhone 14 Pro
            image_url: 'https://placehold.co/600x400?text=iPhone+14+Pro+2',
            alt: 'iPhone 14 Pro Back View',
            sort_order: 2,
            is_main: false
          },
          {
            product_id: productIds[1], // Samsung Galaxy S23
            image_url: 'https://placehold.co/600x400?text=Samsung+Galaxy+S23+1',
            alt: 'Samsung Galaxy S23 Front View',
            sort_order: 1,
            is_main: true
          },
          {
            product_id: productIds[1], // Samsung Galaxy S23
            image_url: 'https://placehold.co/600x400?text=Samsung+Galaxy+S23+2',
            alt: 'Samsung Galaxy S23 Back View',
            sort_order: 2,
            is_main: false
          }
        ]

        console.log('Starting to insert product image data...')
        
        // Insert product images
        for (const image of productImages) {
          const { error } = await supabase
            .from('product_images')
            .insert(image)
          
          if (error) throw error
        }
        console.log('Product image data inserted successfully')

        // Example product reviews
        const productReviews = [
          {
            product_id: productIds[0], // iPhone 14 Pro
            user_id: '00000000-0000-0000-0000-000000000001', // Dummy user ID
            rating: 5,
            content: 'Great phone, excellent camera and good battery life.',
            images: 'https://placehold.co/300x300?text=Review+1',
            status: 1, // Approved
            is_anonymous: false,
            likes: 10
          },
          {
            product_id: productIds[0], // iPhone 14 Pro
            user_id: '00000000-0000-0000-0000-000000000002', // Dummy user ID
            rating: 4,
            content: 'Good overall, but a bit expensive.',
            status: 1, // Approved
            is_anonymous: true,
            likes: 5
          },
          {
            product_id: productIds[1], // Samsung Galaxy S23
            user_id: '00000000-0000-0000-0000-000000000003', // Dummy user ID
            rating: 5,
            content: 'Excellent phone, smooth system, great camera.',
            images: 'https://placehold.co/300x300?text=Review+3',
            status: 1, // Approved
            is_anonymous: false,
            likes: 8
          },
          {
            product_id: productIds[2], // MacBook Pro 14
            user_id: '00000000-0000-0000-0000-000000000001', // Dummy user ID
            rating: 5,
            content: 'Powerful performance, good cooling, excellent display.',
            status: 0, // Pending
            is_anonymous: false,
            likes: 0
          }
        ]

        console.log('Starting to insert product review data...')
        const reviewIds = []
        
        // Insert product reviews
        for (const review of productReviews) {
          const { data, error } = await supabase
            .from('product_reviews')
            .insert(review)
            .select()
          
          if (error) throw error
          console.log(`Review inserted successfully, ID: ${data[0].id}`)
          reviewIds.push(data[0].id)
        }

        // Example review replies
        const reviewReplies = [
          {
            review_id: reviewIds[0], // First review
            user_id: '00000000-0000-0000-0000-000000000010', // Dummy admin ID
            content: 'Thank you for your review. We\'ll continue to provide better products.',
            is_admin: true,
            status: true
          },
          {
            review_id: reviewIds[2], // Third review
            user_id: '00000000-0000-0000-0000-000000000010', // Dummy admin ID
            content: 'Thanks for your support. Welcome to purchase our products again.',
            is_admin: true,
            status: true
          }
        ]

        console.log('Starting to insert review reply data...')
        
        // Insert review replies
        for (const reply of reviewReplies) {
          const { error } = await supabase
            .from('review_replies')
            .insert(reply)
          
          if (error) throw error
        }
        console.log('Review reply data inserted successfully')

        console.log('All data inserted successfully!')
      }

      // Execute data insertion
      await insertData()
      rl.close()
    } catch (error) {
      console.error('Error inserting data:', error)
      rl.close()
    }
  })
})
