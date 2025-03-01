<template>
  <div class="system-management">
    <a-row :gutter="[16, 16]">
      <a-col :span="24">
        <a-card :bordered="false">
          <template #title>
            <div class="card-title">
              <span>系统管理</span>
            </div>
          </template>
          
          <a-menu
            mode="horizontal"
            :selectedKeys="[activeKey]"
            @select="handleMenuSelect"
          >
            <a-menu-item key="database">数据库设置</a-menu-item>
            <a-menu-item key="test-sku">测试SKU功能</a-menu-item>
            <a-menu-item key="settings">系统设置</a-menu-item>
            <a-menu-item key="logs">系统日志</a-menu-item>
          </a-menu>
        </a-card>
      </a-col>
      
      <a-col :span="24">
        <router-view></router-view>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 当前选中的菜单项
const activeKey = computed(() => {
  const path = route.path
  if (path.includes('/database')) return 'database'
  if (path.includes('/test-sku')) return 'test-sku'
  if (path.includes('/settings')) return 'settings'
  if (path.includes('/logs')) return 'logs'
  return 'database'
})

// 处理菜单选择
const handleMenuSelect = ({ key }) => {
  switch (key) {
    case 'database':
      router.push('/system/database')
      break
    case 'test-sku':
      router.push('/system/test-sku')
      break
    case 'settings':
      router.push('/system/settings')
      break
    case 'logs':
      router.push('/system/logs')
      break
  }
}

// 组件挂载时，如果没有子路由，默认跳转到数据库设置
onMounted(() => {
  if (route.path === '/system') {
    router.push('/system/database')
  }
})
</script>

<style scoped>
.system-management {
  padding: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}
</style>
