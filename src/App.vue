<template>
  <router-view />
</template>

<script>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { auth } from './utils/supabase'

export default {
  name: 'App',
  setup() {
    const router = useRouter()

    onMounted(async () => {
      // 检查用户会话
      const { data } = await auth.getSession()
      
      if (!data.session) {
        router.push('/login')
      }
    })

    return {}
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  height: 100vh;
}
</style>
