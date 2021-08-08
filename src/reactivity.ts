import { createEventBus, objectAssign } from './helpers'

const eventBus = createEventBus()
const collection = new Set()

const depend = (effect) => {
  collection.clear()
  const res = effect()
  const dependKeys = Array.from(collection.values())
  collection.clear()
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
      canTrigger = true
      if (!lazy) {
        trigger()
      }
    })
  }

  function effect() {
    if (watcher._isReactive) {
      updateDependKey(watcher._key)
      return watcher
    }

    const [value, dependKeys] = depend(watcher)
    dependKeys.forEach(updateDependKey)
    return value
  }

  function trigger() {
    if (!canTrigger) {
      return currentValue
    }
    console.log('compute 了')

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
  const reactiveObj = new Proxy(
    objectAssign(
      {
        _isReactive: true,
        _key: objEventKey,
      },
      obj
    ),
    {
      get(obj, prop) {
        console.log('get 了')
        collection.add(`${objEventKey}:${String(prop)}`)
        return obj[prop]
      },
      set(obj, prop, value) {
        if (value === obj[prop]) {
          return obj[prop]
        }

        console.log('set 了')
        obj[prop] = value
        eventBus.emit(`${objEventKey}:${String(prop)}`, value)
        eventBus.emit(objEventKey)
        return value
      },
      has(obj, prop) {
        console.log('has 了')
        collection.add(`${objEventKey}:${String(prop)}`)
        return prop in obj
      },
    }
  )
  return reactiveObj
}

// const obj = reactive({ a: 1, b: 1, c: 4, d: 5 })
// const aa = computed(() => obj.a * 10)
// const bb = computed(() => obj.b * 10, true)
// const stopC = watch(
//   () => obj.c,
//   () => {
//     console.log(obj.c)
//   }
// )
// const stop = watch(obj, () => {
//   console.log('obj 更新了')
// })
