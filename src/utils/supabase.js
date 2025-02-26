import { createClient } from '@supabase/supabase-js'

// 创建 Supabase 客户端
// 请注意：在实际使用时需要替换这些值为您的 Supabase 项目的实际 URL 和密钥
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 认证相关方法
export const auth = {
  // 邮箱密码注册
  async signUp(email, password) {
    return await supabase.auth.signUp({
      email,
      password,
    })
  },
  
  // 邮箱密码登录
  async signIn(email, password) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  },
  
  // 退出登录
  async signOut() {
    return await supabase.auth.signOut()
  },
  
  // 获取当前会话
  async getSession() {
    return await supabase.auth.getSession()
  },
  
  // 重置密码
  async resetPassword(email) {
    return await supabase.auth.resetPasswordForEmail(email)
  },
  
  // 更新用户数据
  async updateUser(userData) {
    return await supabase.auth.updateUser(userData)
  }
}

// 用户管理相关方法
export const userApi = {
  // 获取用户列表
  async getUsers() {
    return await supabase
      .from('profiles')
      .select('*')
  },
  
  // 获取单个用户
  async getUserById(id) {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
  },
  
  // 更新用户
  async updateUser(id, userData) {
    return await supabase
      .from('profiles')
      .update(userData)
      .eq('id', id)
  },
  
  // 删除用户
  async deleteUser(id) {
    return await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
  }
}
