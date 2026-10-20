import { DurableObject } from 'cloudflare:workers'

export class UsageMeter extends DurableObject {
  async read() {
    return (await this.ctx.storage.get('count')) || 0
  }

  async consume(limit) {
    const count = (await this.ctx.storage.get('count')) || 0
    if (count >= limit) return { ok: false, count }
    const next = count + 1
    await this.ctx.storage.put('count', next)
    return { ok: true, count: next }
  }

  async release() {
    const count = (await this.ctx.storage.get('count')) || 0
    if (count > 0) await this.ctx.storage.put('count', count - 1)
  }

  async forget() {
    await this.ctx.storage.deleteAll()
  }
}

export function durableUsage(namespace) {
  return {
    read(key) {
      return namespace.getByName(key).read()
    },
    consume(key, limit) {
      return namespace.getByName(key).consume(limit)
    },
    release(key) {
      return namespace.getByName(key).release()
    },
    forget(key) {
      return namespace.getByName(key).forget()
    },
  }
}
