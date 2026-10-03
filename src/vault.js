const DATABASE_NAME = 'leasepath-private-vault'
const LEGACY_DATABASE_NAME = 'stoop-private-vault'
const DATABASE_VERSION = 1
const SETTINGS_KEY = 'vault'
const PBKDF2_ITERATIONS = 310000
const VERIFIER_TEXT = 'leasepath-vault-check-v1'
const LEGACY_VERIFIER_TEXT = 'stoop-vault-check-v1'
let activeKey = null

function openNamedDatabase(name) {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('This browser does not support local document storage.'))
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('settings')) database.createObjectStore('settings', { keyPath: 'id' })
      if (!database.objectStoreNames.contains('documents')) database.createObjectStore('documents', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('The private vault could not be opened.'))
    request.onblocked = () => reject(new Error('Close other LeasePath tabs to open the private vault.'))
  })
}

function openDatabase() {
  return openNamedDatabase(DATABASE_NAME)
}

function readStore(database, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error || new Error('Could not read from the private vault.'))
  })
}

async function migrateLegacyVault() {
  if (!indexedDB.databases) return
  const databases = await indexedDB.databases()
  if (!databases.some((database) => database.name === LEGACY_DATABASE_NAME)) return

  const current = await openNamedDatabase(DATABASE_NAME)
  const currentSettings = await readStore(current, 'settings')
  current.close()
  if (currentSettings.some((record) => record.id === SETTINGS_KEY)) return

  const legacy = await openNamedDatabase(LEGACY_DATABASE_NAME)
  const legacySettings = await readStore(legacy, 'settings')
  const legacyDocuments = await readStore(legacy, 'documents')
  legacy.close()
  if (!legacySettings.some((record) => record.id === SETTINGS_KEY)) return

  const database = await openNamedDatabase(DATABASE_NAME)
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(['settings', 'documents'], 'readwrite')
    const settingsStore = transaction.objectStore('settings')
    const documentsStore = transaction.objectStore('documents')
    legacySettings.forEach((record) => settingsStore.put(record))
    legacyDocuments.forEach((record) => documentsStore.put(record))
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error || new Error('Could not move the existing vault.'))
    }
  })
}

async function readRecord(storeName, id) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not read from the private vault.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => database.close()
  })
}

async function writeRecord(storeName, record) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).put(record)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      const error = transaction.error || new Error('Could not save to the private vault.')
      database.close()
      reject(error)
    }
    transaction.onabort = () => {
      const error = transaction.error || new Error('The vault change was cancelled.')
      database.close()
      reject(error)
    }
  })
}

function deriveKey(passphrase, salt) {
  const encoder = new TextEncoder()
  return crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
    .then((material) => crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    ))
}

async function encryptText(key, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(value))
  return { iv, cipher }
}

async function decryptText(key, iv, cipher) {
  const result = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
  return new TextDecoder().decode(result)
}

export async function vaultExists() {
  if (!('crypto' in window) || !crypto.subtle) return false
  try {
    await migrateLegacyVault()
  } catch {
    // A failed copy should not block creating a new vault.
  }
  return Boolean(await readRecord('settings', SETTINGS_KEY))
}

export function lockVault() {
  activeKey = null
}

export async function createVault(passphrase) {
  if (!crypto?.subtle) throw new Error('This browser does not support secure encryption.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(passphrase, salt)
  const verifier = await encryptText(key, VERIFIER_TEXT)
  await writeRecord('settings', { id: SETTINGS_KEY, salt, verifierIv: verifier.iv, verifierCipher: verifier.cipher })
  activeKey = key
}

export async function unlockVault(passphrase) {
  const settings = await readRecord('settings', SETTINGS_KEY)
  if (!settings) throw new Error('No vault exists on this device yet.')
  const key = await deriveKey(passphrase, settings.salt)
  try {
    const result = await decryptText(key, settings.verifierIv, settings.verifierCipher)
    if (result !== VERIFIER_TEXT && result !== LEGACY_VERIFIER_TEXT) throw new Error('That passphrase did not unlock this vault.')
  } catch {
    throw new Error('That passphrase did not unlock this vault.')
  }
  activeKey = key
}

function requireKey() {
  if (!activeKey) throw new Error('Unlock your vault before opening or saving documents.')
  return activeKey
}

export async function addVaultDocument(file) {
  const key = requireKey()
  const id = crypto.randomUUID()
  const metadata = await encryptText(key, JSON.stringify({ name: file.name, type: file.type }))
  const fileIv = crypto.getRandomValues(new Uint8Array(12))
  const encryptedFile = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: fileIv }, key, await file.arrayBuffer())
  await writeRecord('documents', {
    id,
    metadataIv: metadata.iv,
    metadataCipher: metadata.cipher,
    fileIv,
    fileCipher: encryptedFile,
    createdAt: Date.now(),
  })
}

export async function getVaultDocuments() {
  const key = requireKey()
  const database = await openDatabase()
  const records = await new Promise((resolve, reject) => {
    const transaction = database.transaction('documents', 'readonly')
    const request = transaction.objectStore('documents').getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not list vault documents.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => database.close()
  })
  const documents = await Promise.all(records.map(async (record) => ({
    id: record.id,
    ...JSON.parse(await decryptText(key, record.metadataIv, record.metadataCipher)),
    createdAt: record.createdAt,
  })))
  return documents.sort((a, b) => b.createdAt - a.createdAt)
}

export async function withVaultDocument(id) {
  const key = requireKey()
  const record = await readRecord('documents', id)
  if (!record) throw new Error('This document is no longer in your vault.')
  const metadata = JSON.parse(await decryptText(key, record.metadataIv, record.metadataCipher))
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: record.fileIv }, key, record.fileCipher)
  return { ...metadata, blob: new Blob([bytes], { type: metadata.type || 'application/octet-stream' }) }
}

export async function deleteVaultDocument(id) {
  requireKey()
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('documents', 'readwrite')
    transaction.objectStore('documents').delete(id)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      const error = transaction.error || new Error('Could not delete this document.')
      database.close()
      reject(error)
    }
  })
}
