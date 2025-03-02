<template>
  <div class="test-container">
    <a-card title="商品和SKU功能测试" :bordered="false">
      <a-alert
        v-if="testStatus === 'idle'"
        message="点击下方按钮开始测试商品和SKU相关功能"
        type="info"
        show-icon
      />
      
      <a-alert
        v-if="testStatus === 'running'"
        message="测试正在进行中..."
        type="warning"
        show-icon
      />
      
      <a-alert
        v-if="testStatus === 'success'"
        message="测试完成！所有功能正常"
        type="success"
        show-icon
      />
      
      <a-alert
        v-if="testStatus === 'failed'"
        message="测试失败！请查看下方详细信息"
        type="error"
        show-icon
      />
      
      <div class="action-buttons" style="margin: 16px 0;">
        <a-button type="primary" @click="runTest" :loading="testStatus === 'running'" :disabled="testStatus === 'running'">
          开始全面测试
        </a-button>
        
        <a-button type="primary" @click="runProductFormTest" :loading="testStatus === 'running'" :disabled="testStatus === 'running'" style="margin-left: 8px">
          测试商品表单SKU功能
        </a-button>
        
        <a-button type="primary" @click="runSkuManagementTest" :loading="testStatus === 'running'" :disabled="testStatus === 'running'" style="margin-left: 8px">
          测试SKU管理页面功能
        </a-button>
        
        <a-button style="margin-left: 8px" @click="clearResults" :disabled="testStatus === 'running' || testStatus === 'idle'">
          清除结果
        </a-button>
      </div>
      
      <a-divider />
      
      <div v-if="testResults">
        <h3>测试结果</h3>
        
        <a-collapse v-if="testResults.success && testResults.success.length > 0">
          <a-collapse-panel key="success" header="成功项">
            <a-list item-layout="horizontal" :data-source="testResults.success">
              <template #renderItem="{ item, index }">
                <a-list-item>
                  <a-list-item-meta :description="item">
                    <template #title>测试项 {{ index + 1 }}</template>
                    <template #avatar>
                      <check-circle-outlined style="color: #52c41a; font-size: 20px;" />
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-collapse-panel>
        </a-collapse>
        
        <a-collapse v-if="testResults.failed && testResults.failed.length > 0">
          <a-collapse-panel key="failed" header="失败项">
            <a-list item-layout="horizontal" :data-source="testResults.failed">
              <template #renderItem="{ item, index }">
                <a-list-item>
                  <a-list-item-meta :description="item">
                    <template #title>错误 {{ index + 1 }}</template>
                    <template #avatar>
                      <close-circle-outlined style="color: #f5222d; font-size: 20px;" />
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-collapse-panel>
        </a-collapse>
      </div>
      
      <div v-if="testLogs.length > 0">
        <h3>测试日志</h3>
        <a-card>
          <pre style="max-height: 400px; overflow: auto; background: #f5f5f5; padding: 8px; border-radius: 4px;">{{ testLogs.join('\n') }}</pre>
        </a-card>
      </div>
    </a-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons-vue'
import { testProductSkuFunctions } from '@/utils/testProductSkuFunctions'
import { ensureRpcFunctions } from '@/utils/ensureRpcFunctions'
import { testProductFormSku } from '@/utils/testProductFormSku'
import { testSkuManagement } from '@/utils/testSkuManagement'

// 重写console.log以捕获测试日志
const originalConsoleLog = console.log
const originalConsoleError = console.error

export default {
  components: {
    CheckCircleOutlined,
    CloseCircleOutlined
  },
  setup() {
    const testStatus = ref('idle') // idle, running, success, failed
    const testResults = ref(null)
    const testLogs = ref([])
    
    // 重写console.log和console.error以捕获测试日志
    const setupLogCapture = () => {
      console.log = (...args) => {
        testLogs.value.push(args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg)
            } catch (e) {
              return String(arg)
            }
          }
          return String(arg)
        }).join(' '))
        originalConsoleLog(...args)
      }
      
      console.error = (...args) => {
        testLogs.value.push('ERROR: ' + args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg)
            } catch (e) {
              return String(arg)
            }
          }
          return String(arg)
        }).join(' '))
        originalConsoleError(...args)
      }
    }
    
    // 恢复原始的console方法
    const restoreConsole = () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
    }
    
    // 运行全面测试
    const runTest = async () => {
      testStatus.value = 'running'
      testLogs.value = []
      testResults.value = null
      
      setupLogCapture()
      
      try {
        // 确保RPC函数存在
        await ensureRpcFunctions()
        
        // 运行测试
        const results = await testProductSkuFunctions()
        testResults.value = results
        
        // 根据测试结果设置状态
        if (results.failed && results.failed.length > 0) {
          testStatus.value = 'failed'
          message.error('测试失败，请查看详细信息')
        } else {
          testStatus.value = 'success'
          message.success('测试成功，所有功能正常')
        }
      } catch (error) {
        testStatus.value = 'failed'
        testResults.value = {
          success: [],
          failed: [error.message || '未知错误']
        }
        message.error('测试过程中发生错误')
      } finally {
        restoreConsole()
      }
    }
    
    // 运行商品表单SKU功能测试
    const runProductFormTest = async () => {
      testStatus.value = 'running'
      testLogs.value = []
      testResults.value = null
      
      setupLogCapture()
      
      try {
        // 运行商品表单SKU功能测试
        const results = await testProductFormSku()
        testResults.value = results
        
        // 根据测试结果设置状态
        if (results.failed && results.failed.length > 0) {
          testStatus.value = 'failed'
          message.error('商品表单SKU功能测试失败，请查看详细信息')
        } else {
          testStatus.value = 'success'
          message.success('商品表单SKU功能测试成功')
        }
      } catch (error) {
        testStatus.value = 'failed'
        testResults.value = {
          success: [],
          failed: [error.message || '未知错误']
        }
        message.error('测试过程中发生错误')
      } finally {
        restoreConsole()
      }
    }
    
    // 运行SKU管理页面功能测试
    const runSkuManagementTest = async () => {
      testStatus.value = 'running'
      testLogs.value = []
      testResults.value = null
      
      setupLogCapture()
      
      try {
        // 运行SKU管理页面功能测试
        const results = await testSkuManagement()
        testResults.value = results
        
        // 根据测试结果设置状态
        if (results.failed && results.failed.length > 0) {
          testStatus.value = 'failed'
          message.error('SKU管理页面功能测试失败，请查看详细信息')
        } else {
          testStatus.value = 'success'
          message.success('SKU管理页面功能测试成功')
        }
      } catch (error) {
        testStatus.value = 'failed'
        testResults.value = {
          success: [],
          failed: [error.message || '未知错误']
        }
        message.error('测试过程中发生错误')
      } finally {
        restoreConsole()
      }
    }
    
    // 清除测试结果
    const clearResults = () => {
      testStatus.value = 'idle'
      testResults.value = null
      testLogs.value = []
    }
    
    onMounted(() => {
      // 页面加载时不自动运行测试
    })
    
    return {
      testStatus,
      testResults,
      testLogs,
      runTest,
      runProductFormTest,
      runSkuManagementTest,
      clearResults
    }
  }
}
</script>

<style scoped>
.test-container {
  padding: 24px;
}

.action-buttons {
  display: flex;
  justify-content: flex-start;
}
</style>
