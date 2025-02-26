# 管理后台系统

基于Vue 3、Ant Design Vue和Supabase构建的管理后台系统。

## 功能特性

- 用户认证（邮箱登录/注册）
- 用户管理（创建、查看、编辑、删除用户）
- 响应式设计
- 仪表盘数据统计

## 技术栈

- Vue 3 - 前端框架
- Vue Router - 路由管理
- Pinia - 状态管理
- Ant Design Vue - UI组件库
- Supabase - 后端服务和数据库

## 开始使用

### 先决条件

- Node.js (14.x或更高版本)
- NPM或Yarn
- Supabase账号和项目

### 安装

1. 克隆代码库或解压项目文件
2. 安装依赖

```bash
npm install
# 或
yarn
```

3. 配置环境变量

复制`.env.example`文件并重命名为`.env`，然后填入您的Supabase项目详情：

```
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

您可以在Supabase项目仪表盘的API设置中找到这些值。

4. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

### Supabase数据库配置

在Supabase中，您需要创建以下表：

1. `users` 表扩展 (默认已存在于Supabase Auth中)
   - 添加额外的列：
     - `role` (text): 用户角色 ('admin', 'user', 'guest')
     - `status` (boolean): 用户状态

1. `profiles` 表 (保存用户扩展信息)
   - `id` (UUID, 主键): 关联auth.users的ID
   - `email` (text): 用户邮箱
   - `role` (text): 用户角色 ('admin', 'user', 'guest')
   - `status` (boolean): 用户状态

您可以在Supabase控制台的SQL编辑器中执行项目中的`supabase/setup.sql`文件以创建必要的表结构和权限策略。

这个SQL文件将:
1. 创建profiles表
2. 设置行级安全策略
3. 创建触发器，当新用户注册时自动创建profile记录
4. 为现有用户填充profiles表

#### 使用SQL编辑器设置数据库

1. 登录您的Supabase账户，并打开您的项目
2. 点击左侧菜单中的"SQL编辑器"
3. 创建一个新的查询
4. 复制并粘贴`supabase/setup.sql`中的内容
5. 点击"运行"按钮执行SQL

完成后，您的数据库将配置好所需的表和策略。

## 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建后的文件将生成在`dist`目录下。

## 部署

此项目可以部署到任何支持静态网站的服务，如Vercel、Netlify、GitHub Pages等。

确保在部署环境中也设置了正确的环境变量。
