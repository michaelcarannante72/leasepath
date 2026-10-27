import { useMemo, useState } from 'react'
import {
  KINDS,
  clearEntries,
  deleteEntry,
  downloadIcs,
  readEntries,
  uid,
  upsertEntry,
  writeEntries,
} from '../data/waitlistTracker.js'

const emptyForm = () => ({
  id: '',
  title: '',
  kind: 'lottery',
  status: '',
  remindOn: '',
  notes: '',
})

export function WaitlistTrackerPage() {
  const [entries, setEntries] = useState(() => readEntries())
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)

  const sorted = useMemo(
    () => [...entries].sort((a, b) => String(a.remindOn || '9999').localeCompare(String(b.remindOn || '9999'))),
    [entries],
  )

  function persist(next) {
    setEntries(next)
    writeEntries(next)
  }

  function save(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    const entry = {
      id: form.id || uid(),
      title: form.title.trim(),
      kind: form.kind,
      status: form.status.trim(),
      remindOn: form.remindOn,
      notes: form.notes.trim(),
    }
    persist(upsertEntry(entries, entry))
    setForm(emptyForm())
    setEditing(false)
  }

  function edit(entry) {
    setForm({ ...emptyForm(), ...entry })
    setEditing(true)
  }

  function remove(id) {
    persist(deleteEntry(entries, id))
  }

  function wipe() {
    if (!globalThis.confirm?.('Delete all waitlist entries on this device?')) return
    clearEntries()
    setEntries([])
    setForm(emptyForm())
    setEditing(false)
  }

  return (
    <article className="page waitlist-tracker">
      <p className="eyebrow">Tracker</p>
      <h1>Waitlist and lottery tracker</h1>
      <p className="lede">
        Track NYCHA, Housing Connect lotteries, and other applications on this device only. Add a reminder date and export a .ics calendar file.
        Nothing is sent to a server. You may qualify for openings — the agency decides.
      </p>

      <form className="waitlist-form" onSubmit={save}>
        <h2>{editing ? 'Edit entry' : 'Add entry'}</h2>
        <label>
          Name
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Bronx Housing Connect — 2BR"
            autoComplete="off"
          />
        </label>
        <label>
          Type
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>{k.label}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <input
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            placeholder="Applied, waiting, interview…"
            autoComplete="off"
          />
        </label>
        <label>
          Reminder date
          <input
            type="date"
            value={form.remindOn}
            onChange={(e) => setForm({ ...form, remindOn: e.target.value })}
          />
        </label>
        <label>
          Notes (optional)
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Log number, portal, caseworker name — keep PII only if you want it on this phone"
          />
        </label>
        <p className="card-actions">
          <button type="submit" className="button">{editing ? 'Save changes' : 'Add to tracker'}</button>
          {editing ? (
            <button type="button" className="button button-quiet" onClick={() => { setForm(emptyForm()); setEditing(false) }}>
              Cancel
            </button>
          ) : null}
        </p>
      </form>

      <section aria-labelledby="waitlist-list-title">
        <div className="waitlist-list-head">
          <h2 id="waitlist-list-title">{sorted.length} on this device</h2>
          {sorted.length ? (
            <button type="button" className="button button-quiet" onClick={wipe}>
              Delete all
            </button>
          ) : null}
        </div>
        {!sorted.length ? (
          <p className="empty-note">No entries yet. Add a lottery or waitlist above.</p>
        ) : (
          <ul className="waitlist-list">
            {sorted.map((entry) => (
              <li key={entry.id} className="waitlist-card">
                <h3>{entry.title}</h3>
                <p className="fine">
                  {KINDS.find((k) => k.id === entry.kind)?.label || entry.kind}
                  {entry.status ? ` · ${entry.status}` : ''}
                  {entry.remindOn ? ` · remind ${entry.remindOn}` : ''}
                </p>
                {entry.notes ? <p>{entry.notes}</p> : null}
                <div className="card-actions">
                  <button type="button" className="button button-quiet" onClick={() => edit(entry)}>Edit</button>
                  {entry.remindOn ? (
                    <button type="button" className="button button-quiet" onClick={() => downloadIcs(entry)}>
                      Export .ics
                    </button>
                  ) : null}
                  <button type="button" className="button button-quiet" onClick={() => remove(entry.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="fine">
        Official portals: NYCHA and NYC Housing Connect (HPD). LeasePath does not submit applications.
      </p>
      <p className="card-actions">
        <a className="button button-quiet" href="#/plan">My voucher</a>
        <a className="button button-quiet" href="#/resources">Resources</a>
      </p>
    </article>
  )
}
