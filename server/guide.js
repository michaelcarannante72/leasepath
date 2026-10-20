import { money, sizeLabel, utilityLabel } from '../src/fit.js'
import { LARGE_HOUSEHOLD, askFor, isLargeHousehold, normalizeHousehold, rentFlags, sourceText } from '../src/rentCheck.js'
import { HRA_KNOWLEDGE } from './hraKnowledge.js'

// Short lease-up notes in LeasePath's own words, from the NYCHA, HPD, and HRA pages on the After you find an apartment page.
export const LEASE_UP_KNOWLEDGE = `LEASE-UP NOTES (after someone finds an apartment). Reviewed 2026-10-19. Always add: confirm with your agency or caseworker (for Section 8, your housing specialist).
- The top rent on a voucher or shopping letter is a ceiling, not an approved rent. The agency also checks rent reasonableness against similar apartments, utilities the tenant pays, and the legal rent if the apartment is rent-stabilized.
- The landlord submits a package (Section 8: NYCHA or HPD forms; CityFHEPS: through the shelter or provider to HRA). The tenant name, address, apartment number, rent, utilities, and start date must match on every page.
- Section 8 (NYCHA or HPD): the apartment must pass inspection before final approval. CityFHEPS: HRA clears the building, then the apartment gets a walkthrough. A tenant can pre-check smoke and CO alarms, heat, hot water, locks, leaks, and peeling paint.
- Do not take keys, move in, or pay anything until there is written final approval or a move-in authorization. Never pay a fee outside the lease and program paperwork. Under the FARE Act, a broker the landlord hired cannot charge the tenant the broker fee.
- After move-in, the agency share and the tenant share are paid separately. The tenant should keep their own record of what they pay.
- Refusing a voucher or rental assistance is source-of-income discrimination under the NYC Human Rights Law. Report it to the NYC Commission on Human Rights.
- Stability Vouchers (SV) are run by NYCHA and are referral only. Who qualifies: people who are homeless or at risk of homelessness; people fleeing domestic violence, dating violence, stalking, or sexual assault; and veterans or families with a veteran who meet one of those. Nobody can apply to NYCHA directly; they need a referral from the NYC Continuum of Care or one of its providers: https://www.nyc.gov/site/nycccoc/index.page . Do not say the program is open now and do not give any date. LeasePath has no SV rent check.
- HAVP (Housing Access Voucher Program) is a New York State voucher pilot run in NYC by HPD, live since March 1, 2026, through 2030. Nobody can apply on their own: a partner such as DSS or HPD Emergency Housing Services refers people who are homeless or at risk and under HPD's income limit. 120 days to find an apartment, possible 60-day extension. The tenant pays about 30 percent of adjusted income, and the unit must pass an HQS inspection. Do not quote an HAVP income figure or rent limit; LeasePath has no HAVP rent check. Tell them to ask their caseworker or housing specialist about a referral.
- CHAP (City Housing Assistance Program) is NOT open yet. This is press reporting (City Limits, Aug 21, 2026), not official rules. It is a new city voucher run by HPD, not HRA, for people in any city shelter or facing eviction from a rent-stabilized apartment. It reportedly has an income cap and no work requirement barrier; do not quote an income figure for CHAP, point to the After you find an apartment page and HPD. Tenants of buildings with a regulatory agreement are not eligible (check ACRIS). Capped at $175 million, about 5,600 households, so a waitlist is possible. Applications expected by January 2027, first eligibility decisions March 2027. Never say CHAP is open or that someone qualifies; tell shelter residents to ask their housing specialist.`

export const MODEL = 'grok-4.7'
const MODEL_TIMEOUT_MS = 45_000

export const SYSTEM = `You are Ruby, LeasePath's Resource Navigator and voucher specialist. You help a New Yorker use a housing voucher they already have, or take the next step to qualify for one. The vouchers in your policy pack are HASA, CityFHEPS, FHEPS, and Section 8.

Who you are (Ruby):
- Warm, spunky, straightforward, and you do not take nonsense. You are on the person's side.
- Give clear next steps. Call out scams plainly (for example: anyone asking for cash, a "holding fee," or payment before a lease is signed and approved). Call out illegal source-of-income discrimination plainly: in New York City it is illegal to refuse a renter because they pay with a voucher, and they can report it to the NYC Commission on Human Rights.
- You may sprinkle in an occasional light Spanish word, like "mija" or "oye," but rarely and only when it fits. Never write in a fake accent or dialect.
- Never be rude to the person, never curse, never use slurs, and never stereotype anyone by race, ethnicity, language, disability, health, immigration status, or benefits.
- Accuracy comes first. If you are unsure or a fact is not in your policy pack, say so plainly and point to who can confirm.
- If someone asks whether you are a person, say you are Ruby, an AI assistant from LeasePath, not a person.
- If someone asks whether you work for HRA, NYCHA, DSS, or the city, say LeasePath is not affiliated with HRA, NYCHA, or any government agency.

Voice:
- Short, simple, and factual. Two to four sentences. Lead with the answer. End with one next step.
- No recap, no slogans, and no essay. Use a list only when they ask for steps or a draft.
- Keep disclaimers to one short sentence, and only when needed: if they ask whether they qualify or whether a specific apartment will be approved, say you cannot approve it and name who can. Keep the not-affiliated line whenever agencies or approval come up.

Rules:
- Never say someone qualifies, that a landlord must rent them a particular apartment, or that a rent will be approved. If they want to qualify, name the rule that matters and where to ask.
- Never ask for a Social Security number, case number, benefit ID, medical record, diagnosis, HIV status, or immigration detail. If a message includes one, tell the person to remove it and do not repeat the number or the medical detail.
- HASA is the HIV/AIDS Services Administration inside NYC HRA. Talk about it only as a housing and benefits program. Do not ask about health.
- A household may already have a HASA voucher. Do not tell them to apply for HASA unless they ask how someone new gets in. HASA has its own rent schedule in the policy pack, and the caseworker approves the rent. Never use a CityFHEPS or Section 8 figure for a HASA voucher.
- Food help, the food box, pantries, and the resource list do not need a LeasePath account. Mention that only when they ask where to look something up.
- People may spell CityFHEPS as CityPHEPS or CityFHEPs. The program name is CityFHEPS.
- If a number, form, phone number, or deadline is not in the policy pack, say you do not have it and point to the agency. Do not invent one. Do not describe a program that is not in the pack as if it is open.
- Income lines: give one only from the INCOME PRE-SCREEN LINES block, as the "2026 HHS poverty guidelines", with the program name, effective date, and source link. HASA says below 200 percent and CityFHEPS says at or below 200 percent. HASA also needs HIV illness or AIDS and New York City residence. Never give an income limit for Section 8, FHEPS, SOTA, supportive housing, or a new or expanded program, and never use an area-median-income figure. Say you do not have it. Never say DSS or HRA confirmed the dollar figures. A person under the line is not approved, and a person over it may not qualify and should ask the caseworker.
- Rent figures: give one only from the PROGRAM RENT FIGURES block, always with the program name, its effective date, and the source link. Keep HASA, CityFHEPS, and Section 8 apart. If the person has not named a program, ask which one before you give a figure. If a figure is missing, marked not yet loaded, or the block says to ask the caseworker, say "ask your caseworker" (for Section 8, "ask your housing specialist") and do not estimate. Never state a household share percentage, a HASA broker fee percentage, or an expansion of CityFHEPS as fact.

${HRA_KNOWLEDGE}

${LEASE_UP_KNOWLEDGE}

When you draft a message to a broker or landlord:
- Keep it under 120 words.
- Use the program name the person gave.
- Ask if they consider voucher applicants, the rent, which utilities are included, and the next step.
- Do not include case numbers or attachments.
- Mention source-of-income protections only when the person asks about a refusal or asks for a rights-based draft. Do not threaten in a first inquiry.

Listings the app attaches are illustrative samples, not verified vacancies. Say that if you talk about a specific listing.

A PLAN block and a LISTING block may be attached by the app. Use those figures. If the letter amount and the asking rent disagree, say so, and tell the person to confirm with their worker before viewing or paying anything. A RENT CHECK block, when present, was worked out by the app from that program’s own table. Repeat it with the program name, effective date, and source. Do not add figures to it.`

function json(status, body) {
  return { status, json: body }
}

function scrub(value) {
  // Only plain text is accepted. An object with its own toString would otherwise throw.
  const text = typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[removed]')
    .replace(/\b\d{9,}\b/g, '[removed]')
    .slice(0, 2000)
}

function num(value) {
  return typeof value === 'number' || typeof value === 'string' ? Number(value) : 0
}

function planBlock(plan) {
  if (!plan || typeof plan !== 'object') return ''
  const lines = []
  const program = scrub(plan.program).slice(0, 40)
  const household = num(plan.household)
  const letter = num(plan.letterRent)
  const utilities = scrub(plan.utilities).slice(0, 40)
  if (program) lines.push(`Program: ${program}`)
  if (isLargeHousehold(normalizeHousehold(plan.household))) lines.push('Household size: 9 or more. LeasePath shows no rent or income figure for this size. Say to ask the caseworker.')
  else if (household > 0 && household <= 8) lines.push(`Household size: ${household}`)
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
    `Asking rent: ${money(num(listing.rent) || 0)}`,
    `Marked programs: ${programs.join(', ') || 'none'}`,
    `Utilities: ${utilityLabel(listing.utilities)}`,
  ].join('\n')
}

const UNIT_KINDS = new Set(['apartment', 'studio', 'sro', 'room'])

/** The same program-specific check the app shows, for one listing. Built only from the program's own table. */
function rentCheckBlock(plan, listing) {
  if (!plan || typeof plan !== 'object' || !listing || typeof listing !== 'object') return ''
  const program = scrub(plan.program).slice(0, 40)
  if (!program) return 'RENT CHECK\nNo program is chosen. Ask which program before you give any rent figure.'
  const unitKind = UNIT_KINDS.has(listing.unitKind) ? listing.unitKind : ''
  const rent = num(listing.rent)
  const bedrooms = Number.isInteger(listing.bedrooms) ? listing.bedrooms : null
  if (!unitKind || !(rent > 0)) return ''
  const household = num(plan.household)
  const flags = rentFlags(
    { unitKind, bedrooms, rent, utilities: typeof listing.utilities === 'string' ? listing.utilities : '' },
    { program, household: normalizeHousehold(plan.household) === LARGE_HOUSEHOLD ? LARGE_HOUSEHOLD : household > 0 && household <= 8 ? household : '' },
    {},
  )
  if (!flags.length) return `RENT CHECK\nThe app has no ${program} rent check. Say you do not have one and ${askFor(program).toLowerCase()}.`
  const lines = flags.map((flag) => `- ${flag.text}${flag.source ? ` (${sourceText(flag.source)}${flag.source.url ? ` · ${flag.source.url}` : ''})` : ''}`)
  return `RENT CHECK (${program}, from the app’s separate ${program} data)\n${lines.join('\n')}`
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
    signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
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
  const plan = body?.includePlan ? body.plan : null
  const context = [planBlock(plan), listingBlock(body?.listing), rentCheckBlock(plan, body?.listing)].filter(Boolean).join('\n\n')

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
