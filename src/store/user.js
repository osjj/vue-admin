import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth, userApi } from '@/utils/supabase'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref(null)
  const isInitialized = ref(false)
  const loading = ref(false)
  const error = ref(null)

  // 设置用户
  function setUser(userData) {
    user.value = userData
  }
  
  // 设置初始化状态
  function setInitialized(value) {
    isInitialized.value = value
  }
  
  // 设置加载状态
  function setLoading(value) {
    loading.value = value
    if (value === false) {
      error.value = null
    }
  }
  
  // 设置错误状态
  function setError(errorMessage) {
    error.value = errorMessage
    loading.value = false
  }
  
  // 注册
  async function register(email, password) {
    setLoading(true)
    try {
      const { data, error: authError } = await auth.signUp(email, password)
      
      if (authError) {
        throw authError
      }
      
      if (data?.user) {
        setUser(data.user)
      }
      
      setLoading(false)
      return { data, error: null }
    } catch (err) {
      setError(err.message || '注册失败')
      return { data: null, error: err }
    }
  }
  
  // 登录
  async function login(email, password) {
    setLoading(true)
    try {
      // 首先进行身份验证
      const { data, error: authError } = await auth.signIn(email, password)
      
      if (authError) {
        throw authError
      }
      
      if (data?.user) {
        // 验证用户是否为管理员角色
        const { data: profile, error: profileError } = await userApi.getUserByEmail(email)
        
        if (profileError) {
          throw new Error('获取用户资料失败')
        }
        
        // 如果用户角色不是admin，则拒绝登录
        if (profile?.role !== 'admin') {
          // 登出用户，因为他们已经通过了身份验证但没有权限
          await auth.signOut()
          throw new Error('您没有访问管理后台的权限，请联系系统管理员')
        }
        
        // 用户有admin权限，设置用户信息
        setUser({
          ...data.user,
          role: profile.role
        })
      }
      
      setLoading(false)
      return { data, error: null }
    } catch (err) {
      setError(err.message || '登录失败')
      return { data: null, error: err }
    }
  }
  
  // 退出登录
  async function logout() {
    setLoading(true)
    try {
      const { error: authError } = await auth.signOut()
      
      if (authError) {
        throw authError
      }
      
      setUser(null)
      setLoading(false)
      return { error: null }
    } catch (err) {
      setError(err.message || '退出登录失败')
      return { error: err }
    }
  }

  // 返回状态和操作
  return {
    user,
    isInitialized,
    loading,
    error,
    setUser,
    setInitialized,
    setLoading,
    setError,
    register,
    login,
    logout
  }
})
