import { EventEmitter } from 'events'

const emitter = new EventEmitter()
emitter.setMaxListeners(100)

type Listener = (payload: unknown) => void

export const pubsub = {
  publish(event: string, payload: unknown): void {
    emitter.emit(event, payload)
  },

  subscribe(event: string, listener: Listener): () => void {
    emitter.on(event, listener)
    return () => emitter.off(event, listener)
  },

  asyncIterator(events: string[]): AsyncIterableIterator<unknown> {
    const queue: unknown[] = []
    let resolve: ((value: IteratorResult<unknown>) => void) | null = null

    const listener = (payload: unknown) => {
      if (resolve) {
        const r = resolve
        resolve = null
        r({ value: payload, done: false })
      } else {
        queue.push(payload)
      }
    }

    for (const event of events) emitter.on(event, listener)

    return {
      [Symbol.asyncIterator]() { return this },
      next(): Promise<IteratorResult<unknown>> {
        if (queue.length > 0) return Promise.resolve({ value: queue.shift()!, done: false })
        return new Promise((res) => { resolve = res })
      },
      return() {
        for (const event of events) emitter.off(event, listener)
        return Promise.resolve({ value: undefined, done: true })
      },
      throw(err?: unknown) {
        for (const event of events) emitter.off(event, listener)
        return Promise.reject(err)
      },
    }
  },
}
