const ITERATIONS = 100000

function bytesToB64url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function b64urlToBytes(value) {
  const padded = String(value || '').replaceAll('-', '+').replaceAll('_', '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function safeEqual(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array) || left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index]
  return mismatch === 0
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  )
  return new Uint8Array(bits)
}

export function passwordAccepted(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 200
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(password, salt, ITERATIONS)
  return JSON.stringify({
    algo: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    salt: bytesToB64url(salt),
    hash: bytesToB64url(hash),
  })
}

export async function checkPassword(password, stored) {
  if (!passwordAccepted(password) || typeof stored !== 'string' || !stored) return false
  let parsed
  try {
    parsed = JSON.parse(stored)
  } catch {
    return false
  }
  if (parsed?.algo !== 'PBKDF2-SHA-256') return false
  if (!Number.isInteger(parsed.iterations) || parsed.iterations < 100000 || parsed.iterations > 1000000) return false
  const salt = b64urlToBytes(parsed.salt)
  const expected = b64urlToBytes(parsed.hash)
  if (salt.length < 16 || expected.length !== 32) return false
  const actual = await derive(password, salt, parsed.iterations)
  return safeEqual(actual, expected)
}
