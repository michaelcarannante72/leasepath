import { money, sizeLabel, utilityLabel } from '../src/fit.js'
import { HRA_KNOWLEDGE } from './hraKnowledge.js'

export const MODEL = 'grok-4.7'

const SYSTEM = `You are the LeasePath coach. You help a New Yorker use a housing voucher they already have, or take the next step to qualify for one. The vouchers in your policy pack are HASA, CityFHEPS, FHEPS, and Section 8.

Voice:
- Short, simple, and factual. Two to four sentences. Lead with the answer. End with one next step.
- No greeting, no recap, no slogans, and no essay. Use a list only when they ask for steps or a draft.
- Skip disclaimers. Add one sentence only if they ask whether they qualify or whether a specific apartment will be approved: you cannot approve it, then name who can.

Rules:
- Never say someone qualifies, that a landlord must rent them a particular apartment, or that a rent will be approved. If they want to qualify, name the rule that matters and where to ask.
- Never ask for a Social Security number, case number, benefit ID, medical record, diagnosis, HIV status, or immigration detail. If a message includes one, tell the person to remove it and do not repeat the number or the medical detail.
- HASA is the HIV/AIDS Services Administration inside NYC HRA. Talk about it only as a housing and benefits program. Do not ask about health.
- A household may already have a HASA voucher. Do not tell them to apply for HASA unless they ask how someone new gets in. The caseworker sets that rent. Do not use the CityFHEPS chart for a HASA voucher.
- Food help, the food box, pantries, and the resource list do not need a LeasePath account. Mention that only when they ask where to look something up.
- People may spell CityFHEPS as CityPHEPS or CityFHEPs. The program name is CityFHEPS.
- If a number, form, phone number, or deadline is not in the policy pack, say you do not have it and point to the agency. Do not invent one. Do not describe a program that is not in the pack as if it is open.

${HRA_KNOWLEDGE}

When you draft a message to a broker or landlord:
- Keep it under 120 words.
- Use the program name the person gave.
- Ask if they consider voucher applicants, the rent, which utilities are included, and the next step.
- Do not include case numbers or attachments.
- Mention source-of-income protections only when the person asks about a refusal or asks for a rights-based draft. Do not threaten in a first inquiry.

Listings the app attaches are illustrative samples, not verified vacancies. Say that if you talk about a specific listing.

A PLAN block and a LISTING block may be attached by the app. Use those figures. If the letter amount and the asking rent disagree, say so, and tell the person to confirm with their worker before viewing or paying anything.`

function json(status, body) {
  return { status, json: body }
}

function scrub(value) {
  return String(value || '')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[removed]')
    .replace(/\b\d{9,}\b/g, '[removed]')
    .slice(0, 2000)
}

function planBlock(plan) {
  if (!plan || typeof plan !== 'object') return ''
  const lines = []
  const program = scrub(plan.program).slice(0, 40)
  const household = Number(plan.household)
  const letter = Number(plan.letterRent)
  const utilities = scrub(plan.utilities).slice(0, 40)
  if (program) lines.push(`Program: ${program}`)
  if (household > 0 && household < 20) lines.push(`Household size: ${household}`)
  if (letter > 0 && letter < 100000) lines.push(`Amount typed from their letter: ${money(letter)} a month`)
  if (utilities) lines.push(`Utilities note they typed: ${utilities}`)
  if (!lines.length) return ''
  return `PLAN\n${lines.join('\n')}`
}

function listingBlock(listing) {
  if (!listing || typeof listing !== 'object' || !listing.neighborhood) return ''
  const programs = Array.isArray(listing.programs) ? listing.programs.map((item) => scrub(item).slice(0, 20)).filter(Boolean) : []
  return [
    'LISTING (illustrative sample, not a verified vacancy)',
    `${sizeLabel(listing)} in ${scrub(listing.neighborhood)}, ${scrub(listing.borough)}`,
    `Near: ${scrub(listing.crossStreets)}`,
    `Asking rent: ${money(Number(listing.rent) || 0)}`,
    `Marked programs: ${programs.join(', ') || 'none'}`,
    `Utilities: ${utilityLabel(listing.utilities)}`,
  ].join('\n')
}

function replyText(response) {
  if (typeof response.output_text === 'string' && response.output_text.trim()) return response.output_text.trim()
  const parts = []
  for (const item of response.output || []) {
    if (item.type !== 'message') continue
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) parts.push(content.text)
    }
  }
  return parts.join('\n').trim()
}

async function callXai(key, input) {
  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      input,
      store: false,
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error?.message || 'xai error')
    error.status = response.status
    throw error
  }
  return data
}

export function prepareGuide(body) {
  const history = Array.isArray(body?.messages) ? body.messages.slice(-8) : []
  const input = [{ role: 'system', content: SYSTEM }]
  const context = [planBlock(body?.includePlan ? body.plan : null), listingBlock(body?.listing)].filter(Boolean).join('\n\n')

  for (const message of history) {
    const role = message?.role === 'assistant' ? 'assistant' : 'user'
    const content = scrub(message?.content).trim()
    if (!content) continue
    input.push({ role, content })
  }

  const last = input[input.length - 1]
  if (!last || last.role !== 'user') {
    return { error: json(400, { error: 'empty', message: 'Type a question first.' }) }
  }
  if (context) last.content = `${context}\n\nQUESTION\n${last.content}`
  return { input }
}

export async function completeGuide({ key, input, callModel = callXai }) {
  if (!key) {
    return json(503, {
      error: 'missing_key',
      message:
        'The assistant needs an API key on the server. Add XAI_API_KEY to a .env file and restart, or set it with wrangler secret put XAI_API_KEY before deploy. Create a key at https://console.x.ai/team/default/api-keys',
    })
  }

  try {
    const response = await callModel(key, input)
    const reply = replyText(response)
    if (!reply) {
      return json(502, { error: 'empty_reply', message: 'The assistant did not send a reply. Try again in a moment.' })
    }
    return json(200, { reply })
  } catch (error) {
    const status = error?.status
    console.error(JSON.stringify({ message: 'leasepath guide failed', status: status || error?.message || String(error) }))
    if (status === 401 || status === 403) {
      return json(401, {
        error: 'bad_key',
        message: 'SpaceXAI rejected the API key. Check XAI_API_KEY and try again.',
      })
    }
    if (status === 400 || status === 413) {
      return json(status, { error: 'bad_request', message: 'That question could not be sent. Shorten it and try again.' })
    }
    return json(502, { error: 'upstream', message: 'The assistant did not answer. Try again in a moment.' })
  }
}
