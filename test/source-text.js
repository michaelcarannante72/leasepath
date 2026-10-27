// Components wrap UI text as {tx("English")} for Spanish. Source-grep tests read the English back
// out with untx(), so they keep checking the exact visible copy.
const STR = String.raw`"(?:[^"\\]|\\.)*"`
export function untx(src) {
  return src
    .replace(new RegExp(String.raw`([\w-]+)=\{tx\((${STR})\)\}`, 'g'), (_, name, s) => `${name}=${s}`)
    .replace(new RegExp(String.raw`\{tx\((${STR})\)\}`, 'g'), (_, s) => JSON.parse(s))
}
