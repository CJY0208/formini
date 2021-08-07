export default {
  cjs: {
    type: 'rollup',
    minify: true,
  },
  esm: {
    type: 'rollup',
  },
  umd: {
    name: 'Formini',
    sourcemap: true,
  },
  runtimeHelpers: false,
  extraExternals: ['@vue/reactivity'],
}
