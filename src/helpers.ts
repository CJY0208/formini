const defaultMapper = () => ({})

type Mapper = (...args: any[]) => {
  [key: string]: any
}

export const concat = Array.prototype.concat.bind([])
export const objectAssign = Object.assign
export const defineProperty = (obj, key, value) => {
  obj[key] = value
  return obj
}
export const applyFunction = (func, args) => func.apply(undefined, args)

export const debounce = (func, wait?) => {
  let timeout

  return function () {
    const args = arguments
    clearTimeout(timeout)

    timeout = setTimeout(() => {
      applyFunction(func, args)
    }, wait)

    return timeout
  }
}

export const arr2map = (arr, mapper?: Mapper) =>
  applyFunction(
    objectAssign,
    concat({}, (arr || []).map(mapper || defaultMapper))
  )

export const mapObject = (obj, mapper?: Mapper) =>
  applyFunction(
    objectAssign,
    concat(
      {},
      Object.entries(obj || {}).map((args, idx) =>
        (mapper || defaultMapper).apply(undefined, concat(args, idx))
      )
    )
  )

export const fields2map = (fields, getFieldValue) =>
  arr2map(fields, (field) =>
    defineProperty({}, field.name, getFieldValue(field))
  )

export const getFieldsData = (fields) => ({
  keys: fields.map((field) => field.name),
  allRules: fields2map(fields, (field) => field.rules),
  values: fields2map(fields, (field) => field.defaultValue),
  errors: fields2map(fields, () => undefined),
})

export const getEventListener = (listener, debounceDelay?) => {
  const debouncedListener = debounce(listener, debounceDelay)
  return debounceDelay !== false ? debouncedListener : listener
}

export const createEventBus = () => {
  const listenerMap = {}
  const getCollection = (event) => {
    listenerMap[event] = listenerMap[event] || new Set()
    return listenerMap[event]
  }

  return {
    on(event, listener) {
      const collection = getCollection(event)
      collection.add(listener)
      return () => collection.delete(listener)
    },
    emit(event, value?) {
      const collection = getCollection(event)
      Array.from(collection.values()).forEach((listener: any) =>
        listener(value)
      )
    },
  }
}

export const isFunction = (val: any): val is Function =>
  typeof val === 'function'
