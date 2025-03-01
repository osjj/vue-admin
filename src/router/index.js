import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import { supabase } from '@/utils/supabase'

// 路由组件
const Login = () => import('@/views/Login.vue')
const Register = () => import('@/views/Register.vue')
const MainLayout = () => import('@/components/MainLayout.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const UserManagement = () => import('@/views/UserManagement.vue')
const ProductManagement = () => import('@/views/product/ProductManagement.vue')
const ProductList = () => import('@/views/product/ProductList.vue')
const CategoryList = () => import('@/views/product/CategoryList.vue')
const BrandList = () => import('@/views/product/BrandList.vue')
const ReviewList = () => import('@/views/product/ReviewList.vue')
const OrderManagement = () => import('@/views/order/OrderManagement.vue')
const OrderList = () => import('@/views/order/OrderList.vue')
const InventoryList = () => import('@/views/order/InventoryList.vue')
const InventoryLog = () => import('@/views/order/InventoryLog.vue')
const NotFound = () => import('@/views/NotFound.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: Dashboard,
          meta: { requiresAuth: true }
        },
        {
          path: 'users',
          name: 'users',
          component: UserManagement,
          meta: { requiresAuth: true }
        },
        {
          path: 'products',
          name: 'products',
          component: ProductManagement,
          meta: { requiresAuth: true },
          children: [
            {
              path: '',
              redirect: '/products/list'
            },
            {
              path: 'list',
              name: 'product-list',
              component: ProductList,
              meta: { requiresAuth: true }
            },
            {
              path: 'category',
              name: 'product-category',
              component: CategoryList,
              meta: { requiresAuth: true }
            },
            {
              path: 'brand',
              name: 'product-brand',
              component: BrandList,
              meta: { requiresAuth: true }
            },
            {
              path: 'review',
              name: 'product-review',
              component: ReviewList,
              meta: { requiresAuth: true }
            }
          ]
        },
        {
          path: 'orders',
          name: 'orders',
          component: OrderManagement,
          meta: { requiresAuth: true },
          children: [
            {
              path: '',
              redirect: '/orders/list'
            },
            {
              path: 'list',
              name: 'order-list',
              component: OrderList,
              meta: { requiresAuth: true }
            },
            {
              path: 'inventory',
              name: 'inventory-list',
              component: InventoryList,
              meta: { requiresAuth: true }
            },
            {
              path: 'inventory-log',
              name: 'inventory-log',
              component: InventoryLog,
              meta: { requiresAuth: true }
            }
          ]
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 检查路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // 如果用户状态未初始化，从 supabase 获取当前会话
  if (!userStore.isInitialized) {
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        userStore.setUser(data.session.user)
      }
      userStore.setInitialized(true)
    } catch (error) {
      console.error('Failed to get session:', error)
      userStore.setInitialized(true)
    }
  }
  
  // 根据认证状态和路由要求决定导航行为
  if (requiresAuth && !userStore.user) {
    next('/login')
  } else if (!requiresAuth && userStore.user && (to.path === '/login' || to.path === '/register')) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
