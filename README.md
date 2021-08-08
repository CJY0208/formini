# Formini

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
  // 关联参数，可用作表单项关联控制
  relatives: {
    hasKey1: (values) => typeof values.key1 !== 'undefined',
    hasKey2: (values) => 'key2' in values,
    hasKey5: (values) => 'key5' in values,
  },
})

// 取值与校验
form.setValue('key1', undefined)
await form.validate('key1')

form.getError('key1') // key1 必填

// 监听
form.watchValue('key1', (value) => {
  console.log(value)
})
form.watchError('key1', (value) => {
  console.log(value)
})
form.watchRelative(relativeName, (relative) => {
  console.log(relative)
})
```
