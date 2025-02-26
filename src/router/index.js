import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import { supabase } from '@/utils/supabase'

// 路由组件
const Login = () => import('@/views/Login.vue')
const Register = () => import('@/views/Register.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const UserManagement = () => import('@/views/UserManagement.vue')
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
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/users',
      name: 'users',
      component: UserManagement,
      meta: { requiresAuth: true }
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
