---
sidemenu: false
---

# Formini

纯 js 表单核心

```jsx
import createForm from 'formini'

window.createForm = createForm

var form = createForm({
  fields: [
    {
      name: 'key1',
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
  relatives: {
    hasKey1: (values) => typeof values.key1 !== 'undefined',
    hasKey2: (values) => 'key2' in values,
    hasKey5: (values) => 'key5' in values,
  },
})

window.form = form
```
