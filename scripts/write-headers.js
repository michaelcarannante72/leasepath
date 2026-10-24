import { writeFileSync } from 'node:fs'
import { headersFile } from '../worker/security.js'

writeFileSync(new URL('../public/_headers', import.meta.url), headersFile())
