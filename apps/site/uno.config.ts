import { defineConfig, presetUno, presetAttributify } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(), // 默认预设
    presetAttributify(), // 属性化模式支持
  ],
  shortcuts: {
    btn: 'px-4 py-2 rounded font-semibold transition-colors',
    // 使用 CSS 变量，不硬编码颜色
    'btn-primary': 'btn text-white',
    'btn-secondary': 'btn bg-gray-500 text-white hover:bg-gray-600',
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  },
  // 主题颜色由自定义 CSS 变量提供
  // 不在这里硬编码颜色值
});
