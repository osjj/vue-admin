<template>
  <main-layout>
    <div class="user-management-container">
      <a-page-header
        title="管理后台"
        subtitle="用户管理"
      >
        <template #extra>
          <a-button type="primary" @click="showCreateModal">
            <template #icon>
              <plus-outlined />
            </template>
            添加用户
          </a-button>
        </template>
      </a-page-header>
      
      <a-divider />
      
      <!-- 用户搜索 -->
      <a-form layout="inline" class="search-form">
        <a-form-item label="邮箱">
          <a-input
            v-model:value="searchEmail"
            placeholder="请输入邮箱"
            allow-clear
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <template #icon>
              <search-outlined />
            </template>
            搜索
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">
            <template #icon>
              <reload-outlined />
            </template>
            重置
          </a-button>
        </a-form-item>
      </a-form>
      
      <!-- 用户列表 -->
      <a-table
        :columns="columns"
        :data-source="filteredUsers"
        :loading="loading"
        row-key="id"
        :pagination="{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`
        }"
      >
        <!-- 状态列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status ? 'success' : 'default'">
              {{ record.status ? '启用' : '禁用' }}
            </a-tag>
          </template>
          
          <!-- 角色列 -->
          <template v-if="column.key === 'role'">
            <a-tag :color="getRoleColor(record.role)">
              {{ getRoleName(record.role) }}
            </a-tag>
          </template>
          
          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="showEditModal(record)">
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除此用户吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button type="link" size="small" danger>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
    
    <!-- 创建/编辑用户弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalMode === 'create' ? '添加用户' : '编辑用户'"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :confirm-loading="modalLoading"
    >
      <a-form
        :model="userForm"
        :rules="userFormRules"
        ref="userFormRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item name="email" label="邮箱">
          <a-input v-model:value="userForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        
        <a-form-item name="password" label="密码" v-if="modalMode === 'create'">
          <a-input-password v-model:value="userForm.password" placeholder="请输入密码" />
        </a-form-item>
        
        <a-form-item name="role" label="角色">
          <a-select v-model:value="userForm.role" placeholder="请选择角色">
            <a-select-option value="admin">管理员</a-select-option>
            <a-select-option value="user">普通用户</a-select-option>
            <a-select-option value="guest">访客</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item name="status" label="状态">
          <a-switch
            v-model:checked="userForm.status"
            :checked-children="'启用'"
            :un-checked-children="'禁用'"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </main-layout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import MainLayout from '@/components/MainLayout.vue'
import { userApi, auth, supabase } from '@/utils/supabase'
import { 
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'

// 表格列定义
const columns = [
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    sorter: (a, b) => a.email.localeCompare(b.email)
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    customRender: ({ text }) => new Date(text).toLocaleString()
  },
  {
    title: '上次登录',
    dataIndex: 'last_sign_in_at',
    key: 'last_sign_in_at',
    sorter: (a, b) => new Date(a.last_sign_in_at || 0) - new Date(b.last_sign_in_at || 0),
    customRender: ({ text }) => text ? new Date(text).toLocaleString() : '从未登录'
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    filters: [
      { text: '管理员', value: 'admin' },
      { text: '普通用户', value: 'user' },
      { text: '访客', value: 'guest' }
    ],
    onFilter: (value, record) => record.role === value
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    filters: [
      { text: '启用', value: true },
      { text: '禁用', value: false }
    ],
    onFilter: (value, record) => record.status === value
  },
  {
    title: '操作',
    key: 'action'
  }
]

// 状态定义
const loading = ref(false)
const users = ref([])
const searchEmail = ref('')
const modalVisible = ref(false)
const modalLoading = ref(false)
const modalMode = ref('create') // create 或 edit
const userFormRef = ref(null)

// 用户表单
const userForm = reactive({
  id: null,
  email: '',
  password: '',
  role: 'user',
  status: true
})

// 表单验证规则
const userFormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 根据搜索条件过滤用户
const filteredUsers = computed(() => {
  if (!searchEmail.value) {
    return users.value
  }
  return users.value.filter(user => 
    user.email.toLowerCase().includes(searchEmail.value.toLowerCase())
  )
})

// 获取角色名称
const getRoleName = (role) => {
  switch (role) {
    case 'admin': return '管理员'
    case 'user': return '普通用户'
    case 'guest': return '访客'
    default: return '未知'
  }
}

// 获取角色颜色
const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return 'red'
    case 'user': return 'blue'
    case 'guest': return 'green'
    default: return 'default'
  }
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  
  try {
    // 获取profiles表中的数据
    const { data: profiles, error: profilesError } = await userApi.getUsers();
    
    if (profilesError) {
      throw profilesError;
    }
    
    if (profiles && profiles.length > 0) {
      // 使用profiles数据
      users.value = profiles.map(profile => ({
        ...profile,
        // 确保必要的字段存在
        email: profile.email || '未知邮箱',
        role: profile.role || 'user',
        status: profile.status !== undefined ? profile.status : true,
        created_at: profile.created_at || new Date().toISOString(),
        last_sign_in_at: profile.last_sign_in_at || null
      }));
    } else {
      // 使用示例数据
      setExampleUsers();
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    message.error('获取用户列表失败');
    
    // 使用示例数据
    setExampleUsers();
  } finally {
    loading.value = false;
  }
};

// 设置示例用户数据
const setExampleUsers = () => {
  users.value = [
    {
      id: '1',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      role: 'admin',
      status: true
    },
    {
      id: '2',
      email: 'user@example.com',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      last_sign_in_at: new Date(Date.now() - 3600000).toISOString(),
      role: 'user',
      status: true
    }
  ];
};

// 搜索用户
const handleSearch = () => {
  // 已经通过 computed 属性实现过滤
}

// 重置搜索
const handleReset = () => {
  searchEmail.value = ''
}

// 显示创建用户弹窗
const showCreateModal = () => {
  resetUserForm()
  modalMode.value = 'create'
  modalVisible.value = true
}

// 显示编辑用户弹窗
const showEditModal = (record) => {
  resetUserForm()
  
  userForm.id = record.id
  userForm.email = record.email
  userForm.role = record.role
  userForm.status = record.status
  
  modalMode.value = 'edit'
  modalVisible.value = true
}

// 重置用户表单
const resetUserForm = () => {
  userForm.id = null
  userForm.email = ''
  userForm.password = ''
  userForm.role = 'user'
  userForm.status = true
  
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
}

// 处理弹窗确认
const handleModalOk = async () => {
  try {
    if (userFormRef.value) {
      await userFormRef.value.validate()
      
      modalLoading.value = true
      
      if (modalMode.value === 'create') {
        // 创建用户
        await handleCreateUser()
      } else {
        // 更新用户
        await handleUpdateUser()
      }
      
      modalVisible.value = false
      await fetchUsers()
    }
  } catch (error) {
    console.error('Form validation failed:', error)
  } finally {
    modalLoading.value = false
  }
}

// 创建用户
const handleCreateUser = async () => {
  try {
    // 调用 Supabase 创建用户
    const { data, error } = await auth.signUp(userForm.email, userForm.password)
    
    if (error) {
      throw error
    }
    
    // 创建用户后检查是否自动创建了profile
    // 如果Supabase触发器工作正常，这一步可能是不必要的
    if (data?.user) {
      const { data: profile, error: profileError } = await userApi.getUserById(data.user.id)
      
      if (profileError || !profile) {
        // 如果profile不存在，手动创建
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            role: userForm.role,
            status: userForm.status
          })
      } else {
        // 如果profile已存在但需要更新角色和状态
        await userApi.updateUser(data.user.id, {
          role: userForm.role,
          status: userForm.status
        })
      }
    }
    
    message.success('创建用户成功')
  } catch (error) {
    console.error('Failed to create user:', error)
    message.error(`创建用户失败: ${error.message}`)
    throw error
  }
}

// 更新用户
const handleUpdateUser = async () => {
  try {
    // 调用 Supabase 更新用户
    const { error } = await userApi.updateUser(userForm.id, {
      role: userForm.role,
      status: userForm.status
    })
    
    if (error) {
      throw error
    }
    
    message.success('更新用户成功')
  } catch (error) {
    console.error('Failed to update user:', error)
    message.error(`更新用户失败: ${error.message}`)
    throw error
  }
}

// 处理弹窗取消
const handleModalCancel = () => {
  modalVisible.value = false
  resetUserForm()
}

// 删除用户
const handleDelete = async (record) => {
  loading.value = true
  
  try {
    // 调用 Supabase 删除用户
    const { error } = await userApi.deleteUser(record.id)
    
    if (error) {
      throw error
    }
    
    message.success('删除用户成功')
    await fetchUsers()
  } catch (error) {
    console.error('Failed to delete user:', error)
    message.error(`删除用户失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management-container {
  width: 100%;
}

.search-form {
  margin-bottom: 16px;
}
</style>
