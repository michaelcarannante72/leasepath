import { DurableObject } from 'cloudflare:workers'
import { accountKey, decideAccount, emptyPlace } from '../server/accounts.js'

export class AccountBook extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS account (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        email TEXT NOT NULL,
        place TEXT NOT NULL,
        secret TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      )`)
      const columns = this.ctx.storage.sql.exec('PRAGMA table_info(account)').toArray()
      this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS tombstone (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        deleted_at INTEGER NOT NULL
      )`)
      if (!columns.some((column) => column.name === 'secret')) {
        this.ctx.storage.sql.exec(`ALTER TABLE account ADD COLUMN secret TEXT NOT NULL DEFAULT ''`)
      }
    })
  }

  read() {
    const rows = this.ctx.storage.sql.exec('SELECT email, place, secret, updated_at FROM account WHERE id = 1').toArray()
    if (!rows.length) return null
    try {
      return {
        email: rows[0].email,
        place: JSON.parse(rows[0].place),
        secret: rows[0].secret || '',
        updatedAt: rows[0].updated_at,
      }
    } catch {
      return null
    }
  }

  claim(input) {
    return this.write(input, 'claim')
  }

  save(input) {
    return this.write(input, 'save')
  }

  register(input) {
    const current = this.read()
    if (current?.secret) return { ok: false, error: 'exists' }
    const record = {
      email: input.email,
      place: current?.place || emptyPlace(),
      secret: String(input.secret || ''),
      updatedAt: input.now || '',
    }
    this.store(record)
    return { ok: true, record }
  }

  status() {
    const exists = this.ctx.storage.sql.exec('SELECT 1 FROM account WHERE id = 1').toArray().length > 0
    const row = this.ctx.storage.sql.exec('SELECT deleted_at FROM tombstone WHERE id = 1').toArray()[0]
    return { exists, deletedAt: row ? Number(row.deleted_at) : 0 }
  }

  /** Erase the account row and leave a tombstone (a time only) so every older session is refused. */
  remove(at = Date.now()) {
    const previous = this.status().deletedAt
    const deletedAt = Math.max(Number(at) || Date.now(), previous + 1)
    this.ctx.storage.sql.exec('DELETE FROM account WHERE id = 1')
    this.ctx.storage.sql.exec(
      'INSERT INTO tombstone (id, deleted_at) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET deleted_at = excluded.deleted_at',
      deletedAt,
    )
    return { ok: true, deletedAt }
  }

  write(input, mode) {
    const decision = decideAccount(this.read(), input, mode)
    this.store(decision.record)
    return decision
  }

  store(record) {
    this.ctx.storage.sql.exec(
      `INSERT INTO account (id, email, place, secret, updated_at) VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET email = excluded.email, place = excluded.place, secret = excluded.secret, updated_at = excluded.updated_at`,
      record.email,
      JSON.stringify(record.place),
      record.secret || '',
      record.updatedAt || '',
    )
  }
}

export function durableAccounts(namespace) {
  return {
    read(sub) {
      const key = accountKey(sub)
      if (!key) return null
      return namespace.getByName(key).read()
    },
    claim(sub, input) {
      const key = accountKey(sub)
      if (!key) return null
      return namespace.getByName(key).claim(input)
    },
    save(sub, input) {
      const key = accountKey(sub)
      if (!key) return null
      return namespace.getByName(key).save(input)
    },
    register(sub, input) {
      const key = accountKey(sub)
      if (!key) return null
      return namespace.getByName(key).register(input)
    },
    status(sub) {
      const key = accountKey(sub)
      if (!key) return { exists: false, deletedAt: 0 }
      return namespace.getByName(key).status()
    },
    remove(sub, at) {
      const key = accountKey(sub)
      if (!key) return null
      return namespace.getByName(key).remove(at)
    },
  }
}
