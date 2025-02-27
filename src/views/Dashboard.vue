<template>
  <div class="dashboard-container">
    <a-page-header
      title="管理后台"
      subtitle="仪表盘"
    />
    
    <a-divider />
    
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :sm="12" :md="8" :lg="6">
        <a-card hoverable>
          <template #cover>
            <div class="stat-icon">
              <team-outlined />
            </div>
          </template>
          <a-statistic
            title="用户总数"
            :value="userCount"
            :loading="loading"
          />
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="12" :md="8" :lg="6">
        <a-card hoverable>
          <template #cover>
            <div class="stat-icon">
              <solution-outlined />
            </div>
          </template>
          <a-statistic
            title="系统角色"
            :value="3"
            :loading="loading"
          />
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="12" :md="8" :lg="6">
        <a-card hoverable>
          <template #cover>
            <div class="stat-icon">
              <interaction-outlined />
            </div>
          </template>
          <a-statistic
            title="今日访问"
            :value="todayVisits"
            :loading="loading"
          />
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="12" :md="8" :lg="6">
        <a-card hoverable>
          <template #cover>
            <div class="stat-icon">
              <file-done-outlined />
            </div>
          </template>
          <a-statistic
            title="系统消息"
            :value="systemMessages"
            :loading="loading"
          />
        </a-card>
      </a-col>
    </a-row>
    
    <a-divider />
    
    <a-row :gutter="[16, 16]">
      <a-col :span="24" :lg="16">
        <a-card title="系统概述" :bordered="false">
          <a-empty v-if="loading" />
          <div v-else class="overview-content">
            <p>欢迎使用管理后台系统！</p>
            <p>本系统使用 Vue 3, Ant Design Vue 和 Supabase 构建，具有以下功能：</p>
            <ul>
              <li>用户认证（登录/注册）</li>
              <li>用户管理</li>
              <li>权限控制</li>
              <li>数据统计</li>
            </ul>
            <p>您可以在左侧菜单中选择相应的功能模块进行操作。</p>
          </div>
        </a-card>
      </a-col>
      
      <a-col :span="24" :lg="8">
        <a-card title="最近登录记录" :bordered="false">
          <a-empty v-if="loading || loginRecords.length === 0" />
          <a-list v-else>
            <a-list-item v-for="(record, index) in loginRecords" :key="index">
              <a-list-item-meta>
                <template #avatar>
                  <a-avatar>
                    <template #icon>
                      <user-outlined />
                    </template>
                  </a-avatar>
                </template>
                <template #title>{{ record.email }}</template>
                <template #description>{{ record.time }}</template>
              </a-list-item-meta>
            </a-list-item>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  TeamOutlined, 
  SolutionOutlined, 
  InteractionOutlined, 
  FileDoneOutlined,
  UserOutlined 
} from '@ant-design/icons-vue'
import { userApi } from '@/utils/supabase'

// 定义状态
const loading = ref(true)
const userCount = ref(0)
const todayVisits = ref(0)
const systemMessages = ref(0)
const loginRecords = ref([])

// 模拟获取数据
const fetchDashboardData = async () => {
  loading.value = true
  
  try {
    // 获取用户列表
    const { data, error } = await userApi.getUsers()
    
    if (error) {
      throw error
    }
    
    userCount.value = data?.length || 0
    
    // 模拟其他数据
    todayVisits.value = Math.floor(Math.random() * 100)
    systemMessages.value = Math.floor(Math.random() * 10)
    
    // 模拟登录记录
    if (data && data.length > 0) {
      loginRecords.value = data.slice(0, 5).map(user => ({
        email: user.email,
        time: new Date(user.created_at || Date.now()).toLocaleString()
      }))
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    // 使用模拟数据
    userCount.value = 5
    todayVisits.value = 24
    systemMessages.value = 3
    loginRecords.value = [
      { email: 'admin@example.com', time: new Date().toLocaleString() },
      { email: 'user1@example.com', time: new Date(Date.now() - 3600000).toLocaleString() }
    ]
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}

.stat-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  font-size: 28px;
  color: #1890ff;
  background-color: #e6f7ff;
}

.overview-content {
  font-size: 14px;
  line-height: 1.8;
}

.overview-content ul {
  margin-left: 20px;
  padding-left: 0;
}
</style>
