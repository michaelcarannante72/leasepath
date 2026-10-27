// Lightweight en/es strings for core UI. Language preference stays on the device.
// Spanish is natural NYC Spanish aimed at Dominican and Puerto Rican readers (tú form).

import { PAGE_EN, PAGE_ES } from './i18nPages.js'

export const LANG_KEY = 'leasepath.lang'
export const LANGS = ['en', 'es']

const EN = {
  'nav.search': 'Search',
  'nav.steps': 'Steps',
  'nav.resources': 'Resources',
  'nav.ruby': 'Ruby',
  'nav.blog': 'Blog',
  'nav.plan': 'My voucher',
  'nav.main': 'Main',
  'nav.primary': 'Primary',
  'install.long': 'Install app',
  'install.short': 'Install',
  'auth.signIn': 'Sign in',
  'auth.signUp': 'Sign up / Sign in',
  'lang.label': 'Language',
  'lang.en': 'English',
  'lang.es': 'Español',
  'lang.toggle': 'Español',
  'lang.toggle.en': 'English',

  'hero.eyebrow': 'NYC housing search',
  'hero.title': 'NYC apartments that take HASA, CityFHEPS, and Section 8.',
  'hero.value': 'See if a listing fits your voucher before you call the broker.',
  'hero.cta': 'Check a listing',
  'hero.account': 'Create a free account',
  'hero.anyPhone': 'Works on any phone, no download needed.',
  'hero.notAffiliated': 'Not affiliated with HRA, NYCHA, or any government agency.',
  'hero.mock.tag': 'Example',
  'hero.mock.title': 'Rent check',
  'landing.stepsLabel': 'How LeasePath helps',
  'landing.step1.title': 'Check your voucher',
  'landing.step1.detail': 'Put the amount from your letter in My voucher.',
  'landing.step2.title': 'Find apartments',
  'landing.step2.detail': 'Compare your limit to the asking rent.',
  'landing.step3.title': 'Consult Ruby, our Resource Navigator',
  'landing.step3.detail': 'Straight answers and your next step. Your worker still decides.',

  'search.applyTitle': 'Start the application in the right place',
  'search.applyLede': 'LeasePath cannot tell you whether you qualify. These are the city doors for a new case.',
  'search.call': 'Call',
  'search.open': 'Open',
  'search.sort.rentAsc': 'Rent, low to high',
  'search.sort.rentDesc': 'Rent, high to low',
  'search.sort.neighborhood': 'Neighborhood',
  'search.savedOnly': 'Saved only',
  'search.filters': 'Filters',
  'search.results': 'Sample apartments',
  'search.borough': 'Borough',
  'search.allBoroughs': 'All boroughs',
  'search.beds': 'Beds',
  'search.anyBeds': 'Any',
  'search.program': 'Program',
  'search.allPrograms': 'All',
  'search.maxRent': 'Max rent',
  'search.query': 'Search neighborhood',
  'search.clear': 'Clear filters',

  'resources.eyebrow': 'Resource Navigator',
  'resources.title': 'NYC resources for housing, food, health, and legal help',
  'resources.lede': 'No sign-in. For anyone in New York City who needs help — with or without a voucher. Community groups and official city programs, with the agency site as the source of record. HASA-specific help is labeled in its own section.',
  'resources.helpNow': 'Need help now?',
  'resources.shelter': 'Need shelter tonight? Call 311',
  'resources.crisis': 'Call or text 988 for a mental health crisis',
  'resources.food': 'Food',
  'resources.health': 'Health and support',
  'resources.searchLabel': 'Search resources',
  'resources.searchPlaceholder': 'Name, neighborhood, borough, or type',
  'resources.borough': 'Borough',
  'resources.allBoroughs': 'All boroughs',
  'resources.categories': 'Resource categories',
  'resources.cityPrograms': 'City programs',
  'resources.cityLede': 'Official HRA, NYCHA, HPD, and other agency pages. Applying is always free through the agency. A HASA section is labeled below for people in that program.',
  'resources.showing': 'Showing {shown} of {total} listings.',
  'resources.total': '{total} listings across community groups and city programs.',
  'resources.clear': 'Clear filters',
  'resources.emptyTitle': 'No listings match',
  'resources.emptyBody': 'Try another word, clear the borough chip, or browse a category above. Food pantries, SNAP, rent help, and legal aid are all here.',
  'resources.afterFind': 'After you find an apartment',
  'resources.chap': 'Coming 2027: CHAP, a new city voucher (press reporting)',

  'ruby.intro.eyebrow': 'Resource Navigator',
  'ruby.intro.title': 'Meet Ruby',
  'ruby.intro.body': 'Ruby is LeasePath’s Resource Navigator and voucher specialist. She helps voucher holders through the NYC rental search — shelter, SRO, HRA bureaucracy, documents for a landlord, broker, or caseworker, and deadlines.',
  'ruby.intro.persona': 'A spunky, straightforward Dominican woman in her 40s who takes no BS. Short answers. No runaround.',
  'ruby.intro.talk': 'Talk to Ruby',
  'ruby.intro.later': 'Maybe later',
  'ruby.welcome':
    "Hi, I'm Ruby. I'm designed to assist you in your housing search and help you navigate the complex and fiercely competitive NYC rental market.\n\nI help you stay focused on finding that apartment with a housing voucher.\n\nI know it can be difficult, even exhausting, to search for an apartment with a voucher.\n\nFrom here on out, you don't have to do it alone. I will walk you through every step: from homeless to shelter, to SRO, to navigating the complexities of HRA's bureaucracy. I'll help you keep track of your documents and deadlines for your landlord, broker and caseworker.\n\nWelcome to LeasePath. Let's get you into an apartment.\n\nHave you been given a shopping letter yet by your caseworker?",
}

Object.assign(EN, PAGE_EN)

const ES = {
  'nav.search': 'Buscar',
  'nav.steps': 'Pasos',
  'nav.resources': 'Recursos',
  'nav.ruby': 'Ruby',
  'nav.blog': 'Blog',
  'nav.plan': 'Mi cupón',
  'nav.main': 'Principal',
  'nav.primary': 'Principal',
  'install.long': 'Instalar app',
  'install.short': 'Instalar',
  'auth.signIn': 'Entrar',
  'auth.signUp': 'Crear cuenta / Entrar',
  'lang.label': 'Idioma',
  'lang.en': 'English',
  'lang.es': 'Español',
  'lang.toggle': 'English',
  'lang.toggle.en': 'Español',

  'hero.eyebrow': 'Búsqueda de vivienda en NYC',
  'hero.title': 'Apartamentos en NYC que aceptan HASA, CityFHEPS y Section 8.',
  'hero.value': 'Mira si un anuncio cabe en tu cupón antes de llamar al broker.',
  'hero.cta': 'Revisar un anuncio',
  'hero.account': 'Crear una cuenta gratis',
  'hero.anyPhone': 'Funciona en cualquier celular, sin descargar nada.',
  'hero.notAffiliated': 'No estamos afiliados a HRA, NYCHA ni a ninguna agencia del gobierno.',
  'hero.mock.tag': 'Ejemplo',
  'hero.mock.title': 'Chequeo de renta',
  'landing.stepsLabel': 'Cómo te ayuda LeasePath',
  'landing.step1.title': 'Revisa tu cupón',
  'landing.step1.detail': 'Pon el monto de tu carta en Mi cupón.',
  'landing.step2.title': 'Busca apartamentos',
  'landing.step2.detail': 'Compara tu límite con la renta que piden.',
  'landing.step3.title': 'Consulta a Ruby, nuestra Navegadora de Recursos',
  'landing.step3.detail': 'Respuestas claras y el próximo paso. Tu trabajador de caso decide.',

  'search.applyTitle': 'Empieza la solicitud en el lugar correcto',
  'search.applyLede': 'LeasePath no puede decirte si calificas. Estas son las puertas de la ciudad para un caso nuevo.',
  'search.call': 'Llamar',
  'search.open': 'Abrir',
  'search.sort.rentAsc': 'Renta, de menor a mayor',
  'search.sort.rentDesc': 'Renta, de mayor a menor',
  'search.sort.neighborhood': 'Vecindario',
  'search.savedOnly': 'Solo guardados',
  'search.filters': 'Filtros',
  'search.results': 'Apartamentos de ejemplo',
  'search.borough': 'Municipio',
  'search.allBoroughs': 'Todos los municipios',
  'search.beds': 'Cuartos',
  'search.anyBeds': 'Cualquiera',
  'search.program': 'Programa',
  'search.allPrograms': 'Todos',
  'search.maxRent': 'Renta máxima',
  'search.query': 'Buscar vecindario',
  'search.clear': 'Borrar filtros',

  'resources.eyebrow': 'Navegadora de Recursos',
  'resources.title': 'Recursos de NYC para vivienda, comida, salud y ayuda legal',
  'resources.lede': 'Sin cuenta. Para cualquiera en la ciudad de Nueva York que necesite ayuda — con o sin cupón. Grupos de la comunidad y programas oficiales de la ciudad, con el sitio de la agencia como fuente. La ayuda específica de HASA está marcada en su propia sección.',
  'resources.helpNow': '¿Necesitas ayuda ahora?',
  'resources.shelter': '¿Necesitas refugio esta noche? Llama al 311',
  'resources.crisis': 'Llama o manda texto al 988 si estás en crisis de salud mental',
  'resources.food': 'Comida',
  'resources.health': 'Salud y apoyo',
  'resources.searchLabel': 'Buscar recursos',
  'resources.searchPlaceholder': 'Nombre, vecindario, municipio o tipo',
  'resources.borough': 'Municipio',
  'resources.allBoroughs': 'Todos los municipios',
  'resources.categories': 'Categorías de recursos',
  'resources.cityPrograms': 'Programas de la ciudad',
  'resources.cityLede': 'Páginas oficiales de HRA, NYCHA, HPD y otras agencias. Aplicar siempre es gratis por la agencia. Abajo hay una sección marcada para gente de HASA.',
  'resources.showing': 'Mostrando {shown} de {total} listados.',
  'resources.total': '{total} listados entre grupos de la comunidad y programas de la ciudad.',
  'resources.clear': 'Borrar filtros',
  'resources.emptyTitle': 'Ningún listado coincide',
  'resources.emptyBody': 'Prueba otra palabra, quita el municipio, o mira una categoría arriba. Despensas, SNAP, ayuda de renta y ayuda legal están aquí.',
  'resources.afterFind': 'Después de encontrar un apartamento',
  'resources.chap': 'Llega en 2027: CHAP, un cupón nuevo de la ciudad (según la prensa)',

  'ruby.intro.eyebrow': 'Navegadora de Recursos',
  'ruby.intro.title': 'Conoce a Ruby',
  'ruby.intro.body': 'Ruby es la Navegadora de Recursos de LeasePath y especialista en cupones. Te acompaña en la búsqueda de renta en NYC — refugio, SRO, la burocracia de HRA, papeles para el landlord, el broker o el trabajador de caso, y las fechas límite.',
  'ruby.intro.persona': 'Una dominicana directa y con carácter, en sus 40, que no traga cuento. Respuestas cortas. Sin rodeos.',
  'ruby.intro.talk': 'Hablar con Ruby',
  'ruby.intro.later': 'Tal vez después',
  'ruby.welcome':
    'Hola, soy Ruby. Estoy aquí para ayudarte en tu búsqueda de vivienda y a navegar el mercado de renta en NYC, que está bien difícil y competitivo.\n\nTe ayudo a mantener el foco en conseguir ese apartamento con un cupón de vivienda.\n\nSé que buscar con cupón puede ser agotador.\n\nDe aquí en adelante no tienes que hacerlo solo/a. Te acompaño en cada paso: de la calle al refugio, al SRO, y por la burocracia de HRA. Te ayudo a llevar la cuenta de tus documentos y fechas con el landlord, el broker y tu trabajador de caso.\n\nBienvenido/a a LeasePath. Vamos a conseguirte un apartamento.\n\n¿Ya te dieron la shopping letter tu trabajador de caso?',
}
Object.assign(ES, PAGE_ES)

const TABLES = { en: EN, es: ES }

export function readLang(storage = globalThis.localStorage) {
  try {
    const value = storage?.getItem(LANG_KEY)
    return LANGS.includes(value) ? value : 'en'
  } catch {
    return 'en'
  }
}

export function writeLang(lang, storage = globalThis.localStorage) {
  const next = LANGS.includes(lang) ? lang : 'en'
  try {
    storage?.setItem(LANG_KEY, next)
  } catch {
    /* ignore */
  }
  return next
}

export function applyDocumentLang(lang) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang === 'es' ? 'es' : 'en'
}

export function t(lang, key, vars = {}) {
  const table = TABLES[lang] || EN
  let text = table[key] ?? EN[key] ?? key
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value))
  }
  return text
}

/** Rough check: enough Spanish function words / accents to treat the message as Spanish. */
export function looksLikeSpanish(text) {
  const raw = String(text || '').trim()
  if (!raw) return false
  if (/[áéíóúüñ¿¡]/i.test(raw)) return true
  const tokens = raw.toLowerCase().split(/[^a-záéíóúüñ]+/i).filter(Boolean)
  if (tokens.length === 0) return false
  const hints = new Set([
    'hola', 'gracias', 'por', 'para', 'que', 'qué', 'como', 'cómo', 'donde', 'dónde',
    'cuando', 'cuándo', 'necesito', 'quiero', 'tengo', 'ayuda', 'cupon', 'cupón',
    'apartamento', 'renta', 'alquiler', 'caso', 'trabajador', 'carta', 'puedo',
    'puedes', 'favor', 'mi', 'tu', 'con', 'sin', 'una', 'uno', 'los', 'las', 'del',
    'voucher', 'section', 'cityfheps', 'hasa', 'fheps',
  ])
  // Require Spanish-leaning tokens; "voucher" alone is not enough.
  const strong = ['hola', 'gracias', 'necesito', 'quiero', 'ayuda', 'cupón', 'cupon', 'apartamento', 'alquiler', 'dónde', 'donde', 'cómo', 'como', 'qué', 'que', 'puedo', 'carta']
  let hits = 0
  let strongHits = 0
  for (const token of tokens) {
    if (hints.has(token)) hits += 1
    if (strong.includes(token)) strongHits += 1
  }
  if (strongHits >= 1 && hits >= 2) return true
  if (hits >= 3) return true
  return false
}

export { EN, ES }
