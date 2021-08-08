var createEventBus = () => {
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
    emit(event, value) {
      const collection = getCollection(event)
      ;[...collection.values()].forEach((listener) => listener(value))
    },
  }
}

var eventBus = createEventBus()
var collection = new Set()

var depend = (effect) => {
  collection.clear()
  const res = effect()
  var dependKeys = [...collection.values()]
  collection.clear()
  return [res, dependKeys]
}

var watch = (watcher, callback, lazy) => {
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
    Object.values(listenerMap).forEach((stop) => stop())
  }

  trigger()

  stop.trigger = trigger

  return stop
}

var computed = (effect, immediate) => {
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

var getRandomEventKey = () => Math.floor(Math.random() * 100000)

var reactive = (obj) => {
  const objEventKey = getRandomEventKey()
  const reactiveObj = new Proxy(
    {
      ...obj,
      _isReactive: true,
      _key: objEventKey,
    },
    {
      get(obj, prop) {
        console.log('get 了')
        collection.add(objEventKey + prop)
        return obj[prop]
      },
      set(obj, prop, value) {
        if (value === obj[prop]) {
          return obj[prop]
        }

        console.log('set 了')
        obj[prop] = value
        eventBus.emit(objEventKey + prop, value)
        eventBus.emit(objEventKey)
        return value
      },
      has(obj, prop) {
        console.log('has 了')
        collection.add(objEventKey + prop)
        return prop in obj
      },
    }
  )
  return reactiveObj
}

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
//   console.log('obj 更新了')
// })
