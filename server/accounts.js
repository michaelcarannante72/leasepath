const PROGRAMS = ['CityFHEPS', 'HASA', 'Section 8', 'FHEPS']
const RECEIVING = ['has', 'none', 'unsure']
const UTILITIES = ['All utilities are included', 'I would pay one or more utilities']
const SITUATIONS = [
  'Shelter or transitional housing',
  'Doubled up with someone else',
  'HASA SRO or supportive housing',
  'Renting now',
  'Unsure',
]

export function emptyPlace() {
  return {
    program: '',
    neighborhood: '',
    letterRent: '',
    utilities: '',
    household: '',
    receiving: '',
    situation: '',
    savedIds: [],
    steps: [],
  }
}

export function accountKey(sub) {
  return String(sub || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80)
}

function cleanLine(value, max) {
  let text = ''
  for (const char of String(value || '')) {
    const code = char.charCodeAt(0)
    if (code > 31 && code !== 127) text += char
  }
  return text.replace(/\s+/g, ' ').trim().slice(0, max)
}

export function sanitizePlace(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  const household = String(source.household || '')
  const saved = Array.isArray(source.savedIds) ? source.savedIds : []
  const steps = Array.isArray(source.steps) ? source.steps : []
  const savedIds = []
  for (const id of saved) {
    const clean = String(id || '').toLowerCase()
    if (!/^[a-z0-9-]{1,64}$/.test(clean) || savedIds.includes(clean)) continue
    savedIds.push(clean)
    if (savedIds.length >= 40) break
  }
  const keptSteps = []
  for (const step of steps) {
    if (!Number.isInteger(step) || step < 0 || step > 23 || keptSteps.includes(step)) continue
    keptSteps.push(step)
  }
  return {
    program: PROGRAMS.includes(source.program) ? source.program : '',
    neighborhood: cleanLine(source.neighborhood, 80),
    letterRent: String(source.letterRent || '').replace(/[^\d]/g, '').slice(0, 6),
    utilities: UTILITIES.includes(source.utilities) ? source.utilities : '',
    household: /^([1-8]|9\+)$/.test(household) ? household : '',
    receiving: RECEIVING.includes(source.receiving) ? source.receiving : '',
    situation: SITUATIONS.includes(source.situation) ? source.situation : '',
    savedIds,
    steps: keptSteps,
  }
}

export function placeHasContent(place) {
  if (!place) return false
  return Boolean(
    place.program ||
      place.neighborhood ||
      place.letterRent ||
      place.utilities ||
      place.household ||
      place.receiving ||
      place.situation ||
      place.savedIds?.length ||
      place.steps?.length,
  )
}

function cleanEmail(email) {
  const value = cleanLine(email, 254)
  if (!value.includes('@') || value.includes(' ')) return ''
  return value
}

export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase()
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return ''
  return email
}

export async function emailAccountKey(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return ''
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return accountKey(`mail${hex.slice(0, 40)}`)
}

function keptSecret(current, input) {
  if (input && Object.prototype.hasOwnProperty.call(input, 'secret')) return String(input.secret || '')
  return current?.secret || ''
}

export function decideAccount(current, input, mode) {
  const clean = sanitizePlace(input.place)
  const nextEmail = cleanEmail(input.email) || current?.email || ''
  const secret = keptSecret(current, input)
  if (mode === 'claim' && current && placeHasContent(current.place)) {
    return {
      record: { ...current, email: nextEmail, secret },
      adopted: false,
    }
  }
  return {
    record: {
      email: nextEmail,
      place: clean,
      secret,
      updatedAt: input.now,
    },
    adopted: mode === 'claim',
  }
}

/**
 * A session is honored only if it was issued after the account's last deletion.
 * Deletion leaves a tombstone (time only, no personal data), so every older session on every device is refused
 * and cannot write the account back. A fresh sign-in or sign-up after deletion issues a newer session.
 */
export function sessionRevoked(status, issuedAt) {
  const deletedAt = Number(status?.deletedAt) || 0
  return deletedAt > 0 && !(Number(issuedAt) > deletedAt)
}

export function createMemoryAccounts() {
  const records = new Map()
  const tombstones = new Map()
  return {
    read(key) {
      return records.get(key) || null
    },
    status(key) {
      return { exists: records.has(key), deletedAt: tombstones.get(key) || 0 }
    },
    tombstones() {
      return tombstones.entries()
    },
    seedTombstone(key, at) {
      tombstones.set(key, at)
    },
    entries() {
      return records.entries()
    },
    claim(key, input) {
      const decision = decideAccount(records.get(key) || null, input, 'claim')
      records.set(key, decision.record)
      return decision
    },
    save(key, input) {
      const decision = decideAccount(records.get(key) || null, input, 'save')
      records.set(key, decision.record)
      return decision
    },
    register(key, input) {
      const current = records.get(key) || null
      if (current?.secret) return { ok: false, error: 'exists' }
      const record = {
        email: input.email,
        place: current?.place || emptyPlace(),
        secret: input.secret,
        updatedAt: input.now,
      }
      records.set(key, record)
      return { ok: true, record }
    },
    remove(key, at = Date.now()) {
      const ok = records.delete(key)
      tombstones.set(key, Math.max(Number(at) || Date.now(), (tombstones.get(key) || 0) + 1))
      return { ok, deletedAt: tombstones.get(key) }
    },
  }
}

export function createFileAccounts(file, io) {
  const memory = createMemoryAccounts()
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
      for (const [key, at] of Object.entries(parsed.__deleted || {})) {
        if (Number.isFinite(at)) memory.seedTombstone(key, at)
      }
      for (const [key, record] of Object.entries(parsed)) {
        if (key === '__deleted') continue
        if (!record || typeof record !== 'object' || !record.place) continue
        memory.save(key, {
          email: record.email,
          place: record.place,
          secret: record.secret || '',
          now: record.updatedAt || '',
        })
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }

  async function persist() {
    await io.mkdir(io.dirname(file), { recursive: true })
    const snapshot = {}
    for (const [key, record] of memory.entries()) snapshot[key] = record
    snapshot.__deleted = Object.fromEntries(memory.tombstones())
    await io.writeFile(file, JSON.stringify(snapshot))
  }

  return {
    read(key) {
      return queue(async () => {
        await load()
        return memory.read(key)
      })
    },
    claim(key, input) {
      return queue(async () => {
        await load()
        const decision = memory.claim(key, input)
        await persist()
        return decision
      })
    },
    save(key, input) {
      return queue(async () => {
        await load()
        const decision = memory.save(key, input)
        await persist()
        return decision
      })
    },
    register(key, input) {
      return queue(async () => {
        await load()
        const result = memory.register(key, input)
        if (result.ok) await persist()
        return result
      })
    },
    status(key) {
      return queue(async () => {
        await load()
        return memory.status(key)
      })
    },
    remove(key, at) {
      return queue(async () => {
        await load()
        const result = memory.remove(key, at)
        await persist()
        return result
      })
    },
  }
}
