// 运行数据填充脚本
import { spawn } from 'child_process'
import readline from 'readline'

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 提示用户输入 Supabase URL 和密钥
rl.question('Enter Supabase URL: ', (url) => {
  rl.question('Enter Supabase Anon Key: ', (key) => {
    console.log('Running data seed script...')
    
    // 设置环境变量并运行脚本
    const env = {
      ...process.env,
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY: key
    }
    
    // 运行数据填充脚本
    const seedProcess = spawn('node', ['seed-product-data.js'], { 
      env,
      stdio: 'inherit',
      shell: true
    })
    
    seedProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Data seeding completed successfully!')
      } else {
        console.error(`Data seeding failed with exit code: ${code}`)
      }
      rl.close()
    })
  })
})
