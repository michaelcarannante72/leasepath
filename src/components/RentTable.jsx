import { askFor, money } from '../rentCheck.js'
import { isDisplayable, sourceFor } from '../data/sourced.js'
import { SourceLine } from './SourceLine.jsx'

/**
 * One program's rent table. Rows must all belong to `program`. A row that is not an official sourced row
 * shows "Ask your caseworker" in place of the number.
 */
export function RentTable({ program, rows, columns, caption }) {
  const first = rows.find(isDisplayable) || rows[0]
  return (
    <div className="rent-table">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}
            <th scope="col">{program} maximum</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            if (row.program !== program) throw new Error(`${program} table was given a ${row.program} row`)
            return (
              <tr key={`${row.scheduleId}-${row.rentType || ''}-${row.unitKind}-${row.bedrooms ?? 'x'}-${index}`}>
                {columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}
                <td>{isDisplayable(row) ? money(row.maxRent) : askFor(program)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {first && <p className="fine"><SourceLine source={sourceFor(first, program)} /></p>}
    </div>
  )
}

