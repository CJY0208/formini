import { createEventBus, objectAssign } from './helpers'

const eventBus = createEventBus()
const collection = new Set()
const reactiveMap = new Map()

const depend = (effect) => {
  collection.clear()
  const res = effect()
  const dependKeys = Array.from(collection.values())
  collection.clear()
  // console.log(dependKeys)
  return [res, dependKeys]
}

export const watch = (watcher, callback, lazy?) => {
  let canTrigger = true
  let currentValue
  const listenerMap = {}
  const updateDependKey = (eventKey) => {
    if (listenerMap[eventKey]) {
      return
    }

    listenerMap[eventKey] = eventBus.on(eventKey, () => {
      // console.log('on event', eventKey)
      canTrigger = true
      if (!lazy) {
        trigger()
      }
    })
  }

  function effect() {
    if (reactiveMap.has(watcher)) {
      updateDependKey(reactiveMap.get(watcher))
      return watcher
    }

    const dependConfig = depend(watcher)
    const value = dependConfig[0]
    const dependKeys = dependConfig[1]
    dependKeys.forEach(updateDependKey)
    return value
  }

  function trigger() {
    if (!canTrigger) {
      return currentValue
    }
    // console.log('compute 了')

    const value = effect()
    currentValue = value
    callback(value)
    canTrigger = false
    return value
  }

  function stop() {
    Object.values(listenerMap).forEach((stop: any) => stop())
  }

  trigger()

  stop.trigger = trigger

  return stop
}

export const computed = (effect, immediate?) => {
  let computedValue

  const { trigger: compute } = watch(
    effect,
    (value) => {
      computedValue = value
    },
    !immediate
  )

  const reactiveComputed = {}
  Object.defineProperty(reactiveComputed, 'value', {
    get() {
      return compute()
    },
    set() {
      return computedValue
    },
  })

  return reactiveComputed
}

const getRandomEventKey = () => Math.floor(Math.random() * 100000)

export const reactive = (obj) => {
  const objEventKey = getRandomEventKey()
  const addEventCollection = (prop) => {
    collection.add(`${objEventKey}:${String(prop)}`)
  }
  const emitChangeEvent = (prop) => {
    eventBus.emit(`${objEventKey}:${String(prop)}`)
    eventBus.emit(objEventKey)
  }
  const reactiveObj = new Proxy(objectAssign({}, obj), {
    get(obj, prop) {
      // console.log(`get ${prop}`)
      addEventCollection(prop)
      return obj[prop]
    },
    has(obj, prop) {
      // console.log(`check has ${prop}`)
      addEventCollection(prop)
      return prop in obj
    },
    set(obj, prop, value) {
      // console.log(`set ${prop} to ${value}`)

      if (value !== obj[prop]) {
        emitChangeEvent(prop)
      }

      obj[prop] = value

      return true
    },
    deleteProperty(obj, prop) {
      if (prop in obj) {
        emitChangeEvent(prop)
      }

      delete obj[prop]

      return true
    },
  })
  reactiveMap.set(reactiveObj, objEventKey)
  return reactiveObj
}

Object.assign(window, {
  reactive,
  computed,
  watch,
})

// var obj = reactive({ a: 1, b: 1, c: 4, d: 5 })
// var aa = computed(() => obj.a * 10)
// var bb = computed(() => obj.b * 10, true)
// var stopC = watch(
//   () => obj.c,
//   () => {
//     console.log(obj.c)
//   }
// )
// var stop = watch(obj, () => {
// console.log('obj 更新了')
// })
