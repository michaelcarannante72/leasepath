export function createMemoryUsage() {
  const counts = new Map()
  return {
    read(key) {
      return counts.get(key) || 0
    },
    consume(key, limit) {
      const count = counts.get(key) || 0
      if (count >= limit) return { ok: false, count }
      const next = count + 1
      counts.set(key, next)
      return { ok: true, count: next }
    },
    release(key) {
      const count = counts.get(key) || 0
      if (count > 0) counts.set(key, count - 1)
    },
    seed(key, count) {
      counts.set(key, count)
    },
    snapshot() {
      return Object.fromEntries(counts)
    },
  }
}

export function createFileUsage(file, io) {
  const memory = createMemoryUsage()
  let loaded = false
  let chain = Promise.resolve()

  function queue(task) {
    const run = chain.then(task, task)
    chain = run.then(
      () => {},
      () => {},
    )
    return run
  }

  async function load() {
    if (loaded) return
    loaded = true
    try {
      const raw = await io.readFile(file, 'utf8')
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return
      for (const [key, count] of Object.entries(parsed)) {
        if (Number.isInteger(count) && count >= 0) memory.seed(key, count)
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }

  async function persist() {
    await io.mkdir(io.dirname(file), { recursive: true })
    await io.writeFile(file, JSON.stringify(memory.snapshot()))
  }

  return {
    read(key) {
      return queue(async () => {
        await load()
        return memory.read(key)
      })
    },
    consume(key, limit) {
      return queue(async () => {
        await load()
        const result = memory.consume(key, limit)
        if (result.ok) await persist()
        return result
      })
    },
    release(key) {
      return queue(async () => {
        await load()
        memory.release(key)
        await persist()
      })
    },
  }
}
