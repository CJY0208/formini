import { reactive, computed, effect, stop } from '@vue/reactivity'

export { reactive, computed }
export const watch = (getter, listener) => {
  let firstTime = true
  const runner = effect(() => {
    const data = getter()
    if (!firstTime) {
      listener(data)
    }
    firstTime = false
  })

  return () => stop(runner)
}
