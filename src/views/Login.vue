<template>
  <div class="login-container">
    <a-card class="login-card" title="管理后台登录" :bordered="false">
      <a-form
        :model="formState"
        name="login-form"
        @finish="onFinish"
        :rules="rules"
      >
        <a-form-item name="email" has-feedback>
          <a-input
            v-model:value="formState.email"
            placeholder="请输入邮箱"
            size="large"
          >
            <template #prefix>
              <mail-outlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="password" has-feedback>
          <a-input-password
            v-model:value="formState.password"
            placeholder="请输入密码"
            size="large"
          >
            <template #prefix>
              <lock-outlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-button type="link" @click="goToRegister">
                立即注册
              </a-button>
            </a-col>
            <a-col :span="12" style="text-align: right">
              <a-button type="link" @click="forgotPassword">
                忘记密码
              </a-button>
            </a-col>
          </a-row>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="userStore.loading"
            block
            size="large"
          >
            登 录
          </a-button>
        </a-form-item>
      </a-form>
      
      <a-alert 
        v-if="userStore.error"
        type="error" 
        :message="userStore.error" 
        show-icon 
      />
    </a-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { MailOutlined, LockOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const userStore = useUserStore()

// 表单状态
const formState = reactive({
  email: '',
  password: ''
})

// 表单验证规则
const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ]
}

// 表单提交
const onFinish = async (values) => {
  const { data, error } = await userStore.login(values.email, values.password)
  
  if (error) {
    console.error('Login error:', error)
  } else {
    message.success('登录成功')
    router.push('/dashboard')
  }
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}

// 忘记密码
const forgotPassword = () => {
  message.info('密码重置功能尚未实现')
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  width: 100%;
  max-width: 400px;
}
</style>
