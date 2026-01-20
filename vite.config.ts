import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    
    // ✅ 2. 自动引入组件 (使得我们可以直接在 template 里写 <i-ph-heart />)
    Components({
      resolvers: [
        // 自动解析图标组件
        IconsResolver({
          prefix: 'icon', // 使用前缀，例如 <icon-ph-user />
          enabledCollections: ['ph', 'lucide'], // 启用 phosphor 和 lucide 图标集
        }),
      ],
    }),

    // ✅ 3. 图标插件配置
    Icons({
      autoInstall: true, // 如果缺图标自动安装
      compiler: 'vue3',
    }),
  ],
})