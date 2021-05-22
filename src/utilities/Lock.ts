export class Lock {
  private promiseQueue = [] as (() => void)[]
  private acquired = false

  acquireAsync() {
    return new Promise<void>(resolve => {
      if (this.acquired) {
        this.promiseQueue.push(resolve)
      } else {
        this.acquired = true
        resolve()
      }
    })
  }

  release() {
    if (!this.acquired) throw new Error(`Cannot release an unacquired lock`)

    const resolve = this.promiseQueue.shift()
    if (resolve) resolve()
    else this.acquired = false
  }
}
