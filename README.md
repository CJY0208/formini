# Formini

[![size](https://img.shields.io/bundlephobia/minzip/formini@latest.svg)](https://bundlephobia.com/result?p=formini@latest)
![](https://visitor-badge.glitch.me/badge?page_id=cjy0208.formini)
<!-- [![dm](https://img.shields.io/npm/dm/formini.svg)](https://github.com/CJY0208/formini) -->

纯 js 迷你表单核心，包含值管理与简单的错误校验，且基于 Proxy 实现表单关联功能

[在线示例](https://codesandbox.io/s/formini-vue3-demo-cc984)

## 安装

```bash
npm install formini --save
# or
yarn add formini
```

## 使用方式

```js
import createForm from 'formini'

const form = createForm({
  fields: [
    {
      name: 'key1',
      defaultValue: 1,
      rules: [
        (value) => (typeof value === 'undefined' ? 'key1 必填' : undefined),
      ],
    },
    { name: 'key2', defaultValue: 2 },
    {
      name: 'key3',
      rules: [
        (value) => (typeof value === 'undefined' ? 'key3 必填' : undefined),
      ],
    },
  ],
  // 关联参数，基于 Proxy 响应式数据自动收集依赖，定向更新
  relatives: {
    hasKey1: (values) => typeof values.key1 !== 'undefined',
    hasKey2: (values) => 'key2' in values,
    hasKey5: (values) => 'key5' in values,
    hasError: (values, errors) => Object.values(errors).some(Boolean),
    // 可用作表单项关联控制
    showField2: (values) => values.key1 === 'magic'
  },
})

// 写值与校验
form.setValue({
  key1: undefined
})
await form.validate()
form.getErrors() // { key1: 'key1 必填', key2: undefined, key3: 'key3 必填' }

form.reset() // 重置

// 定向写值与校验
form.setValue('key1', undefined)
await form.validate('key1')
form.getError('key1') // key1 必填

const stop0 = form.watch(() => { // 监听 form 的所有变化，包括 values、errors、relatives
  console.log('form 发生了变化')
})

const stop1 = form.watchValues((values) => { // 监听全部 values
  console.log(values)
})
const stop2 = form.watchValue('key1', (value) => { // 监听指定 value
  console.log(value)
})

const stop3 = form.watchErrors((errors) => { // 监听全部 errors
  console.log(errors)
})
const stop4 = form.watchError('key1', (error) => { // 监听指定 error
  console.log(error)
})

const stop5 = form.watchRelatives((relatives) => { // 监听全部 relatives（关联）
  console.log(relatives)
})
const stop6 = form.watchRelative('hasKey1', (relative) => { // 监听指定 relative（关联）
  console.log(relative)
})
```
