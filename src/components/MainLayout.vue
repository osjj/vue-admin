<template>
  <a-layout class="main-layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      width="250"
      collapsedWidth="80"
      class="main-sidebar"
    >
      <div class="logo">
        <h1 v-if="!collapsed">管理后台</h1>
        <h1 v-else>后台</h1>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
      >
        <a-menu-item key="dashboard" @click="navigateTo('/dashboard')">
          <template #icon>
            <dashboard-outlined />
          </template>
          <span>仪表盘</span>
        </a-menu-item>
        <a-menu-item key="users" @click="navigateTo('/users')">
          <template #icon>
            <user-outlined />
          </template>
          <span>用户管理</span>
        </a-menu-item>
        <a-sub-menu key="products">
          <template #icon>
            <shopping-outlined />
          </template>
          <template #title>商品管理</template>
          <a-menu-item key="product-list" @click="navigateTo('/products/list')">
            <span>商品列表</span>
          </a-menu-item>
          <a-menu-item key="product-category" @click="navigateTo('/products/category')">
            <span>分类管理</span>
          </a-menu-item>
          <a-menu-item key="product-brand" @click="navigateTo('/products/brand')">
            <span>品牌管理</span>
          </a-menu-item>
          <a-menu-item key="product-review" @click="navigateTo('/products/review')">
            <span>评论管理</span>
          </a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="orders">
          <template #icon>
            <shopping-cart-outlined />
          </template>
          <template #title>订单与库存</template>
          <a-menu-item key="order-list" @click="navigateTo('/orders/list')">
            <span>订单列表</span>
          </a-menu-item>
          <a-menu-item key="inventory-list" @click="navigateTo('/orders/inventory')">
            <span>库存管理</span>
          </a-menu-item>
          <a-menu-item key="inventory-log" @click="navigateTo('/orders/inventory-log')">
            <span>库存日志</span>
          </a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="system">
          <template #icon>
            <setting-outlined />
          </template>
          <template #title>系统管理</template>
          <a-menu-item key="database-setup" @click="navigateTo('/system/database')">
            <span>数据库设置</span>
          </a-menu-item>
          <a-menu-item key="test-sku" @click="navigateTo('/system/test-sku')">
            <span>测试SKU功能</span>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    <a-layout :style="{ marginLeft: collapsed ? '80px' : '250px', transition: 'margin-left 0.2s' }">
      <a-layout-header class="main-header">
        <div class="header-left">
          <menu-unfold-outlined
            v-if="collapsed"
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
          <menu-fold-outlined
            v-else
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
        </div>
        <div class="header-right">
          <a-dropdown>
            <a class="ant-dropdown-link" @click.prevent>
              <a-avatar>
                <template #icon>
                  <user-outlined />
                </template>
              </a-avatar>
              <span class="username">{{ userName }}</span>
              <down-outlined />
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item key="profile">
                  <user-outlined />
                  个人资料
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="handleLogout">
                  <logout-outlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content class="main-content">
        <router-view></router-view>
      </a-layout-content>
      <a-layout-footer class="main-footer">
        管理后台系统 {{ new Date().getFullYear() }} Created by Vue & Ant Design
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { 
  MenuUnfoldOutlined, 
  MenuFoldOutlined, 
  DashboardOutlined, 
  UserOutlined,
  ShoppingOutlined,
  DownOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  SettingOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 侧边栏折叠状态
const collapsed = ref(false)

// 当前选中的菜单项
const selectedKeys = ref([])

// 设置当前选中的菜单项
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/dashboard')) {
      selectedKeys.value = ['dashboard']
    } else if (path.startsWith('/users')) {
      selectedKeys.value = ['users']
    } else if (path.startsWith('/products/list')) {
      selectedKeys.value = ['product-list']
    } else if (path.startsWith('/products/category')) {
      selectedKeys.value = ['product-category']
    } else if (path.startsWith('/products/brand')) {
      selectedKeys.value = ['product-brand']
    } else if (path.startsWith('/products/review')) {
      selectedKeys.value = ['product-review']
    } else if (path.startsWith('/orders/list')) {
      selectedKeys.value = ['order-list']
    } else if (path.startsWith('/orders/inventory')) {
      selectedKeys.value = ['inventory-list']
    } else if (path.startsWith('/orders/inventory-log')) {
      selectedKeys.value = ['inventory-log']
    } else if (path.startsWith('/system/database')) {
      selectedKeys.value = ['database-setup']
    } else if (path.startsWith('/system/test-sku')) {
      selectedKeys.value = ['test-sku']
    }
  },
  { immediate: true }
)

// 用户名称
const userName = computed(() => {
  return userStore.user?.email || '未知用户'
})

// 导航到指定路由
const navigateTo = (path) => {
  router.push(path)
}

// 处理登出
const handleLogout = async () => {
  const { error } = await userStore.logout()
  
  if (error) {
    message.error('退出登录失败')
  } else {
    message.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.main-sidebar {
  overflow: auto;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
}

.main-layout .main-sidebar .logo {
  height: 64px;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.main-layout .main-sidebar .logo h1 {
  color: #fff;
  margin: 0;
  white-space: nowrap;
  font-size: 1.2rem;
}

.main-header {
  background: #fff;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 9;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  width: 100%;
}

.header-left {
  margin-left: 16px;
}

.header-right {
  margin-right: 16px;
}

.trigger {
  padding: 0 24px;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.username {
  margin-left: 8px;
  margin-right: 4px;
}

.main-content {
  margin: 24px 16px;
  padding: 24px;
  background: #fff;
  min-height: 280px;
  overflow: initial;
  width: calc(100% - 32px);
}

.main-footer {
  text-align: center;
}

@media (max-width: 768px) {
  .main-sidebar {
    position: absolute;
  }
  
  .main-layout .ant-layout {
    margin-left: 0 !important;
  }
  
  .main-layout .ant-layout-sider-collapsed + .ant-layout {
    margin-left: 0 !important;
  }
}
</style>
