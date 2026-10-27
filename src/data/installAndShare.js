/** Install + share helpers. Share targets open SMS/WhatsApp with a prefilled leasepath.app link. No third-party scripts. */

export const APP_URL = 'https://leasepath.app'
export const SHARE_TEXT = 'LeasePath — NYC voucher housing help on your phone: https://leasepath.app'
export const QR_SRC = '/images/leasepath-qr.png'

export const INSTALL_STEPS = {
  iphone: {
    title: 'iPhone (Safari)',
    steps: [
      'Open leasepath.app in Safari (not Chrome or an in-app browser).',
      'Tap the Share button (square with an arrow up).',
      'Scroll and tap “Add to Home Screen”.',
      'Tap Add. LeasePath appears like an app icon.',
    ],
  },
  chromePhone: {
    title: 'Chrome on a phone',
    steps: [
      'Open leasepath.app in Chrome.',
      'Tap the menu (three dots).',
      'Tap “Install app” or “Add to Home screen”.',
      'Confirm. Or use the Install button in the LeasePath header when Chrome offers it.',
    ],
  },
}

export const SHARE_TEXT_ES = 'LeasePath — ayuda de vivienda con vales de NYC en su teléfono: https://leasepath.app'

export const INSTALL_STEPS_ES = {
  iphone: {
    title: 'iPhone (Safari)',
    steps: [
      'Abra leasepath.app en Safari (no en Chrome ni en el navegador de otra app).',
      'Toque el botón Compartir (el cuadrado con una flecha hacia arriba).',
      'Baje y toque “Agregar a pantalla de inicio”.',
      'Toque Agregar. LeasePath aparece como el ícono de una app.',
    ],
  },
  chromePhone: {
    title: 'Chrome en un teléfono',
    steps: [
      'Abra leasepath.app en Chrome.',
      'Toque el menú (tres puntos).',
      'Toque “Instalar app” o “Agregar a pantalla principal”.',
      'Confirme. O use el botón Instalar en el encabezado de LeasePath cuando Chrome lo ofrezca.',
    ],
  },
}

/** Install steps in the reader's language. */
export function installSteps(lang) {
  return lang === 'es' ? INSTALL_STEPS_ES : INSTALL_STEPS
}

/** Share text in the reader's language; the link stays the same. */
export function shareText(lang) {
  return lang === 'es' ? SHARE_TEXT_ES : SHARE_TEXT
}

export function smsShareHref(text = SHARE_TEXT) {
  return `sms:?&body=${encodeURIComponent(text)}`
}

export function whatsappShareHref(text = SHARE_TEXT) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function mailtoShareHref(text = SHARE_TEXT) {
  return `mailto:?subject=${encodeURIComponent('LeasePath')}&body=${encodeURIComponent(text)}`
}
