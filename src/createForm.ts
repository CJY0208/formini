import { reactive, computed, watch as watchReactivity } from './reactivity'
import {
  debounce,
  createEventBus,
  mapObject,
  getFieldsData,
  getEventListener,
  isFunction,
  objectAssign,
  objectEntries,
  defineProperty,
  concat,
} from './helpers'

const RELATIVE_CHANGE = 'rc'

export interface WatchOptions {
  debounce?: number | boolean | false
}

export type Rule = (value, values) => Promise<any> | any

export interface Field {
  name: string
  defaultValue?: any
  rules?: Rule[]
}

interface OverridedField {
  name?: string
  defaultValue?: any
  rules?: Rule[]
}

export interface FormOptions {
  fields?: Field[]
  relatives?: {
    [key: string]: (values, errors) => any
  }
}

export type StopWatch = () => void
export type RemoveRelative = () => void
export type Value = any
export type Values = Record<string, Value>
export type Error = any
export type Errors = Record<string, Error>
export type Relative = any
export type Relatives = Record<string, Relative>
export type ComputeRelative = (values: Values, errors: Errors) => Relative

export interface Form {
  getValue: (name: string) => Value;
  getValues: () => Values;
  setValue: (name: string, value: Value) => void;
  setValues: (values: Values) => void;
  watchValues: (listener: (values: Values) => void, options?: WatchOptions) => StopWatch;
  watchValue: (name: string, listener: (value: Value) => void, options?: WatchOptions) => StopWatch;
  getError: (name: string) => Error;
  getErrors: () => Errors;
  setError: (name: string) => void;
  setErrors: (errors: Errors) => void;
  watchErrors: (listener: (errors: Errors) => void, options?: WatchOptions) => StopWatch;
  watchError: (name: string, listener: (value: Value) => void, options?: WatchOptions) => StopWatch;
  getFields: () => FormOptions['fields'];
  setFields: (nextFields: FormOptions['fields']) => void;
  removeField: (fieldName: string) => void;
  addField: (field: Field) => () => void;
  getField: (fieldName: string) => Field | void;
  setField: (fieldName, field: OverridedField) => void;
  hasField: (fieldName: string) => boolean;
  setFieldValues: (values: Values) => void;
  getRelative: (name: string) => Relative;
  getRelatives: () => Relatives;
  setRelatives: (configs: Record<string, ComputeRelative>) => void;
  removeRelative: (name: string) => void;
  addRelative: (name: string, compute: ComputeRelative) => RemoveRelative;
  watchRelatives: (listener: (relatives: Relatives) => void, options?: WatchOptions) => StopWatch;
  watchRelative: (name: string, listener: (relative: Relative) => void, options?: WatchOptions) => StopWatch;
  watch: (listener: () => void) => StopWatch;
  validate: (filedNames?: string[] | string) => Promise<boolean>;
  reset: () => void;
}

export default function createForm(formOptions?: FormOptions): Form {
  formOptions = formOptions || {}
  const initalFields = formOptions.fields || []
  const initialRelativeConfigs = formOptions.relatives || {}
  const initialFieldsData = getFieldsData(initalFields)
  let { keys, allRules } = initialFieldsData
  const setReactivityData = (data, update) => {
    objectAssign(data, update)

    // 过滤掉未在 fields 内声明的数据
    Object.keys(data).forEach((key) => {
      if (!keys.includes(key)) {
        delete data[key]
      }
    })
  }

  // 创建响应式数据相关函数
  const buildReactivityData = (sourceData) => {
    const values = reactive(sourceData)
    const getValue = (key) => (values || {})[key]
    const getValues = () => objectAssign({}, values)
    const setValue = (key, value) =>
      setReactivityData(values, defineProperty({}, key, value))
    const setValues = (update) => setReactivityData(values, update || {})
    const watchValues = (listener, options?: WatchOptions) =>
      watchReactivity(
        values,
        getEventListener(listener, (options || {}).debounce)
      )
    const watchValue = (key, listener, options?: WatchOptions) =>
      watchReactivity(
        () => values[key],
        getEventListener(listener, (options || {}).debounce)
      )
    return [
      values,
      getValue,
      getValues,
      setValue,
      setValues,
      watchValues,
      watchValue,
    ]
  }

  // +++++++++++++++++++++++ values 相关 begin ++++++++++++++++++++++++++++
  const valueDataConfig = buildReactivityData(initialFieldsData.values)
  const values = valueDataConfig[0]
  const getValue = valueDataConfig[1]
  const getValues = valueDataConfig[2]
  const setValue = valueDataConfig[3]
  const setValues = valueDataConfig[4]
  const watchValues = valueDataConfig[5]
  const watchValue = valueDataConfig[6]
  // ----------------------- values 相关 end ------------------------------

  // +++++++++++++++++++++++ errors 相关 begin ++++++++++++++++++++++++++++
  const errorDataConfig = buildReactivityData(initialFieldsData.errors)
  const errors = errorDataConfig[0]
  const getError = errorDataConfig[1]
  const getErrors = errorDataConfig[2]
  const setError = errorDataConfig[3]
  const setErrors = errorDataConfig[4]
  const watchErrors = errorDataConfig[5]
  const watchError = errorDataConfig[6]
  // ----------------------- errors 相关 end ------------------------------

  // +++++++++++++++++++++++ fields 相关 begin ++++++++++++++++++++++++++++
  let fields = concat(initalFields)
  const getFields = () => concat(fields)
  const setFields = (nextFields) => {
    fields = concat(nextFields || [])
    const fieldsData = getFieldsData(fields)

    keys = fieldsData.keys
    allRules = fieldsData.allRules

    setValues(objectAssign({}, fieldsData.values, values))
    setErrors(objectAssign({}, fieldsData.errors, errors))
  }
  const removeField = (fieldName) =>
    setFields(getFields().filter((field) => field.name !== fieldName))
  const addField = (field) => {
    setFields(concat(getFields(), field))
    return () => removeField(field.name)
  }
  const getField = (fieldName) => {
    const fields = getFields()
    const field = fields?.find((field) => field.name === fieldName)
    return field
  }
  const setField = (fieldName, fieldConfig) => {
    const field = getField(fieldName)
    if (!!field) {
      objectAssign(field, fieldConfig)
      setFields(fields)
    } else {
      addField(objectAssign({ name: fieldName }, fieldConfig))
    }
  }
  const hasField = (fieldName) => !!getField(fieldName)
  const setFieldValues = values => {
    const fields = objectEntries(values).map(([name]) => {
      const currentField = getField(name)
      if (currentField) {
        return currentField
      }

      return { name }
    })
    setFields(fields)
    setValues(values)
  }
  // ----------------------- fields 相关 end ------------------------------

  // +++++++++++++++++++++++ relatives 相关 begin ++++++++++++++++++++++++++++
  const eventBus = createEventBus()
  const triggerRelativesChange = debounce(() => eventBus.emit(RELATIVE_CHANGE, getRelatives()))
  const currentRelatives = {}
  const buildRelatives = (configs) =>
    mapObject(configs, (key, compute) =>
      defineProperty(
        {},
        key,
        computed(() => {
          // console.log('compute key:', key)
          const currentRelative = currentRelatives[key]
          const nextValue = compute(values, errors)
          if (nextValue !== currentRelative) {
            eventBus.emit(`${RELATIVE_CHANGE}:${key}`, nextValue)
            triggerRelativesChange()
          }
          currentRelatives[key] = nextValue

          return nextValue
        }, true)
      )
    ) || {}
  let currentRelativeConfigs = objectAssign({}, initialRelativeConfigs)
  let relatives = buildRelatives(currentRelativeConfigs)
  const getRelative = (key) => (relatives[key] || {}).value
  const getRelatives = () =>
    mapObject(relatives, (key, relative) =>
      defineProperty({}, key, relative.value)
    )
  const setRelatives = (configs) => {
    currentRelativeConfigs = objectAssign({}, configs)
    relatives = buildRelatives(configs)
  }
  const removeRelative = (name) => {
    delete currentRelativeConfigs[name]
    setRelatives(currentRelativeConfigs)
  }
  const addRelative = (name, compute) => {
    setRelatives(
      objectAssign(
        {},
        currentRelativeConfigs,
        defineProperty({}, name, compute)
      )
    )

    return () => removeRelative(name)
  }
  const triggerRelativeWatcher = (
    eventName,
    listener,
    options?: WatchOptions
  ) => {
    const eventListener = getEventListener(listener, (options || {}).debounce)
    return eventBus.on(eventName, eventListener)
  }
  const watchRelatives = (listener, options?: WatchOptions) =>
    triggerRelativeWatcher(RELATIVE_CHANGE, listener, options)
  const watchRelative = (key, listener, options?: WatchOptions) =>
    triggerRelativeWatcher(`${RELATIVE_CHANGE}:${key}`, listener, options)

  // ----------------------- relatives 相关 end ------------------------------

  // +++++++++++++++++++++++ 其他 ++++++++++++++++++++++++++++
  const watch = (listener) => {
    const eventListender = getEventListener(listener)
    const debounceConfig = { debounce: false }
    const stopValuesListener = watchValues(eventListender, debounceConfig)
    const stopErrorsListener = watchValues(eventListender, debounceConfig)
    const stopRelativesListener = watchRelatives(eventListender, debounceConfig)

    return () => {
      stopValuesListener()
      stopErrorsListener()
      stopRelativesListener()
    }
  }

  const validate = (filedKeys) => {
    filedKeys = filedKeys || keys
    if (typeof filedKeys === 'string') {
      filedKeys = [filedKeys]
    }

    // 多个 fields 并行校验
    // 单个 field 的多个 rules 串行校验
    return Promise.all(
      filedKeys.map((key) => {
        const rules = allRules[key] || []
        const value = values[key]
        errors[key] = undefined

        const applyRule = (rule) =>
          Promise.resolve(rule(value, values)).then((result) =>
            // 利用 reject 中断 Promise 串行链条
            typeof result !== 'undefined' ? Promise.reject(result) : undefined
          )

        return rules
          .filter(isFunction)
          .reduce(
            (task, rule) => task.then(() => applyRule(rule)),
            Promise.resolve()
          )
          .catch((error) => {
            errors[key] = error
            return error
          })
          .then((error) => !!error)
      })
    ).then((result) => {
      const valid = !result.some(Boolean)
      return valid
    })
  }

  const reset = () => {
    const fieldsData = getFieldsData(fields)
    setValues(fieldsData.values)
    setErrors(fieldsData.errors)
  }
  // ----------------------- 其他 ----------------------------

  return {
    getValue,
    getValues,
    setValue,
    setValues,
    watchValues,
    watchValue,

    getError,
    getErrors,
    setError,
    setErrors,
    watchErrors,
    watchError,

    getFields,
    setFields,
    removeField,
    addField,
    getField,
    setField,
    hasField,
    setFieldValues,

    getRelative,
    getRelatives,
    setRelatives,
    removeRelative,
    addRelative,
    watchRelatives,
    watchRelative,

    watch,
    validate,
    reset,
  }
}
