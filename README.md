# Formini

[![size](https://img.shields.io/bundlephobia/minzip/formini@latest.svg)](https://bundlephobia.com/result?p=formini@latest)
![](https://visitor-badge.glitch.me/badge?page_id=cjy0208.formini)
<!-- [![dm](https://img.shields.io/npm/dm/formini.svg)](https://github.com/CJY0208/formini) -->

纯 js 表单核心

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

// 定向写值与校验
form.setValue('key1', undefined)
await form.validate('key1')
form.getError('key1') // key1 必填

// 监听全部 values
form.watchValues((values) => {
  console.log(values)
})
form.watchValue('key1', (value) => {
  console.log(value)
})

// 监听 errors
form.watchError('key1', (value) => {
  console.log(value)
})
form.watchRelative(relativeName, (relative) => {
  console.log(relative)
})
```
