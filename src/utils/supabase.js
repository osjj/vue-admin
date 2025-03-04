import { createClient } from '@supabase/supabase-js'

// 创建 Supabase 客户端
// 请注意：在实际使用时需要替换这些值为您的 Supabase 项目的实际 URL 和密钥
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 获取存储文件的URL
export function getFileUrl(path) {
  // 如果已经是完整URL，直接返回
  if (path && path.startsWith('http')) {
    return Promise.resolve(path)
  }
  
  // 如果路径为空，返回空字符串
  if (!path) {
    return Promise.resolve('')
  }
  
  // 获取签名URL（有效期设置为1小时）
  return supabase.storage
    .from('products')
    .createSignedUrl(path, 3600) // 1小时 = 3600秒
    .then(({ data, error }) => {
      if (error) {
        console.error('获取签名URL失败:', error)
        // 如果获取签名URL失败，尝试使用公共URL
        const publicUrl = supabase.storage.from('products').getPublicUrl(path).data?.publicUrl
        return publicUrl || ''
      }
      return data?.signedUrl || ''
    })
    .catch(error => {
      console.error('获取文件URL失败:', error)
      return ''
    })
}

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
  
  // 通过邮箱获取用户
  async getUserByEmail(email) {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
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
