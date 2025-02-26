<template>
  <div class="register-container">
    <a-card class="register-card" title="管理后台注册" :bordered="false">
      <a-form
        :model="formState"
        name="register-form"
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

        <a-form-item name="confirmPassword" has-feedback>
          <a-input-password
            v-model:value="formState.confirmPassword"
            placeholder="请确认密码"
            size="large"
          >
            <template #prefix>
              <lock-outlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button type="link" @click="goToLogin">
            已有账号？点击登录
          </a-button>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="userStore.loading"
            block
            size="large"
          >
            注 册
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
  password: '',
  confirmPassword: ''
})

// 表单验证规则
const validateConfirmPassword = async (rule, value) => {
  if (!value) {
    return Promise.reject('请确认密码')
  }
  if (value !== formState.password) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 表单提交
const onFinish = async (values) => {
  const { data, error } = await userStore.register(values.email, values.password)
  
  if (error) {
    console.error('Registration error:', error)
  } else {
    message.success('注册成功，请登录')
    router.push('/login')
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.register-card {
  width: 100%;
  max-width: 400px;
}
</style>
