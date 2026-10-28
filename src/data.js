import { SHOW_SAMPLE_LISTINGS } from './features.js'
import { SAMPLE_LISTINGS } from './data/sampleListings.archive.js'

/** Only the HRA-list apartments render; the sample listings are archived behind a flag. */
export const LISTINGS = SHOW_SAMPLE_LISTINGS ? SAMPLE_LISTINGS : []

export const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']

export const STEPS = [
  {
    title: 'Name the program',
    detail: 'If you already have a HASA voucher, keep your worker’s name and the rent on that paperwork. CityFHEPS and Section 8 use their own letters.',
  },
  {
    title: 'Get the rent amount in writing',
    detail: 'Ask for your shopping letter or voucher paperwork. That page has the rent you can shop with, and how utilities are counted.',
  },
  {
    title: 'Gather what your worker asked for',
    detail: 'Keep the letter, photo ID, and any forms your worker named. Some CityFHEPS packets use a landlord statement about the broker (W-147M, only when a broker fee is requested) and an HRA security voucher (W-147N). Ask which current forms apply to you.',
  },
  {
    title: 'Search, then ask',
    detail: 'Compare the asking rent and the utilities with your letter before you schedule a viewing. A first message does not need your case number.',
  },
  {
    title: 'Send the apartment in for review',
    detail: 'CityFHEPS units are registered, checked for rent reasonableness and violations, and walked through before a lease packet can be approved. Section 8 and HASA have their own inspection steps. Your worker tells you which ones are yours.',
  },
  {
    title: 'Read the lease before you sign',
    detail: 'Wait for program approval before you move in or pay a fee. Side payments above the lease rent are not allowed on CityFHEPS.',
  },
]

export const ACCESS_HRA_URL = 'https://a069-access.nyc.gov/accesshra/'
export const HOMEBASE_URL = 'https://www.nyc.gov/site/hra/help/homebase.page'

export const RESOURCES = [
  {
    group: 'HASA voucher',
    title: 'HASA services',
    // Exact copy from the housing specialist. Do not edit without her.
    detail: "HASA (part of NYC HRA) helps NYC residents living with HIV or AIDS with case management, housing help, and benefits. You don't need an AIDS diagnosis or symptoms to qualify. In most HASA rental help, you pay about 30% of your income and HASA pays the rest. HASA will ask for medical proof; LeasePath never asks for or stores it.",
    href: 'https://www.nyc.gov/site/hra/help/hiv-aids-services.page',
    action: 'Open HASA services',
  },
  {
    group: 'HASA voucher',
    title: 'HASA questions and answers',
    detail: 'The official HASA FAQ. ServiceLine, for a new application, is on the DSS OneNumber weekdays 9am to 5pm.',
    href: 'https://www.nyc.gov/assets/hra/HASA/SPSVC-18-E.pdf',
    action: 'Open the HASA FAQ',
  },
  {
    group: 'Food',
    title: 'Food boxes and home meals',
    detail: 'Medicaid members can ask a Social Care Network about food boxes, medically tailored meals, pantry restocking, and home-delivered meals. A HASA voucher does not add this by itself. Bronx: SOMOS, 833-766-6769. Brooklyn, Manhattan, and Queens: Public Health Solutions, 888-755-5045. Staten Island: 917-830-1140.',
    href: 'https://www.nyc.gov/site/hra/help/social-care-network.page',
    action: 'Open Social Care Network',
  },
  {
    group: 'Food',
    title: 'Pantries and community kitchens',
    detail: 'HRA’s Community Food Connection funds more than 700 pantries and kitchens. Groceries or a hot meal, no LeasePath account. The page opens the Food Help NYC map. Call 311 and ask for food near you.',
    href: 'https://www.nyc.gov/site/hra/help/food-assistance.page',
    action: 'Open HRA food help',
  },
  {
    group: 'Food',
    title: 'SNAP',
    detail: 'Monthly groceries on an EBT card. HRA’s page explains the benefit and links to ACCESS HRA to apply or check a case. This is separate from a food box.',
    href: 'https://www.nyc.gov/site/hra/help/snap-benefits-food-program.page',
    action: 'Open HRA SNAP',
  },
  {
    group: 'Food',
    title: 'Extra produce with SNAP',
    detail: 'Get the Good Stuff matches SNAP dollars spent on fruits, vegetables, and beans at participating supermarkets, up to $10 a day. Health Bucks work at farmers markets.',
    href: 'https://www.nyc.gov/site/doh/health/health-topics/free-produce-snap.page',
    action: 'See Get the Good Stuff',
  },
  {
    group: 'Food',
    title: 'All city food programs',
    detail: 'The Mayor’s Office of Food Policy list: pantries, SNAP, food boxes, and meals.',
    href: 'https://www.nyc.gov/site/foodpolicy/programs/programs.page',
    action: 'Open the food list',
  },
  {
    group: 'Rent help and vouchers',
    title: 'CityFHEPS',
    detail: 'The city rent supplement. Different from a HASA voucher. Apartments can be anywhere in New York State. Rooms and SROs stay in the five boroughs.',
    href: 'https://www.nyc.gov/site/hra/help/cityfheps.page',
    action: 'Open CityFHEPS',
  },
  {
    group: 'Rent help and vouchers',
    title: 'CityFHEPS client FAQ',
    detail: 'DSS-7r, dated January 23, 2026. Shopping letters, the household share, and the 2026 payment standards.',
    href: 'https://www.nyc.gov/assets/hra/downloads/pdf/cityfheps-documents/dss-7r-e.pdf',
    action: 'Open the client FAQ',
  },
  {
    group: 'Rent help and vouchers',
    title: 'CityFHEPS rent chart',
    detail: 'Landlord and broker FAQ, DSS-8j, dated January 28, 2026. The chart is the maximum when all utilities are included.',
    href: 'https://www.nyc.gov/assets/hra/downloads/pdf/cityfheps-documents/dss-8j-e.pdf',
    action: 'Open the landlord FAQ',
  },
  {
    group: 'Rent help and vouchers',
    title: 'FHEPS',
    detail: 'State and city rent supplement for a Cash Assistance family with a child, or a pregnant person, facing eviction or already evicted.',
    href: 'https://www.nyc.gov/site/hra/help/fheps.page',
    action: 'Open FHEPS',
  },
  {
    group: 'Rent help and vouchers',
    title: 'Section 8 at NYCHA',
    detail: 'Housing Choice Voucher. Your payment standard is on your own paperwork. NYCHA and HPD run it, not HRA. NYCHA standards are on My voucher.',
    href: 'https://www.nyc.gov/site/nycha/section-8/about-section-8.page',
    action: 'Open NYCHA Section 8',
  },
  {
    group: 'Rent help and vouchers',
    title: 'One-shot deal',
    detail: 'A one-time emergency grant, often for back rent. Not a monthly voucher. You do not need a court case to ask. Apply on ACCESS HRA as emergency Cash Assistance.',
    href: 'https://www.nyc.gov/site/hra/help/rent-back-on-track.page',
    action: 'See emergency rent help',
  },
  {
    group: 'Rent help and vouchers',
    title: 'Homebase',
    detail: 'Homelessness prevention offices. Eviction help, benefits, and CityFHEPS or FHEPS applications for people in the community.',
    href: HOMEBASE_URL,
    action: 'Find a Homebase',
  },
  {
    group: 'Rent help and vouchers',
    title: 'Cash Assistance',
    detail: 'Ongoing cash benefits through HRA. Some rent supplements require an active case.',
    href: 'https://www.nyc.gov/site/hra/help/cash-assistance.page',
    action: 'Open Cash Assistance',
  },
  {
    group: 'Rent help and vouchers',
    title: 'Supportive housing',
    detail: 'Affordable housing with services, in one building or in apartments around the city. A caseworker handles the referral.',
    href: 'https://www.nyc.gov/site/hra/help/supportive-housing.page',
    action: 'Open supportive housing',
  },
  {
    group: 'Rent help and vouchers',
    title: 'Pathway Home',
    detail: 'For someone who has been in shelter at least 90 days and can move in with family or friends. The city can pay that host for up to 12 months.',
    href: 'https://www.nyc.gov/site/hra/help/pathway-home.page',
    action: 'Open Pathway Home',
  },
  {
    group: 'Rent help and vouchers',
    title: 'SOTA',
    detail: 'One year of rent for some shelter households with income from work, SSI, or SSD. It can be used once. It is not a HASA voucher.',
    href: 'https://www.nyc.gov/site/hra/help/sota.page',
    action: 'Open SOTA',
  },
  {
    group: 'If a landlord says no',
    title: 'Source of income',
    detail: 'Refusing CityFHEPS, FHEPS, Section 8, or Cash Assistance can be illegal. HRA explains what that sounds like. The Commission on Human Rights is 212-416-0197.',
    href: 'https://www.nyc.gov/site/hra/help/income-discrimination.page',
    action: 'Read HRA’s page',
  },
  {
    group: 'If a landlord says no',
    title: 'Commission on Human Rights',
    detail: 'Where to report source-of-income discrimination. This is general information, not legal advice.',
    href: 'https://www.nyc.gov/site/cchr/media/source-of-income.page',
    action: 'Read the commission page',
  },
  {
    group: 'If a landlord says no',
    title: 'Housing legal help',
    detail: 'Free or low-cost help with a housing problem or possible discrimination.',
    href: 'https://www.nyc.gov/site/hra/help/legal-services-for-tenants.page',
    action: 'Find legal help',
  },
  {
    group: 'Jobs and training',
    title: 'Free online courses (NYS Department of Labor and Coursera)',
    detail: 'Free Coursera courses and certificates through NYS DOL, in tech, business, and more. Who qualifies: New York residents over 18 who are unemployed or underemployed, or people outside New York who get New York unemployment benefits. Sign up from the DOL page with your NY.GOV ID, and use the same email for Coursera. Signing up on Coursera directly does not get you the free account. LeasePath is not affiliated with NYS DOL or Coursera.',
    href: 'https://dol.ny.gov/online-learning-coursera',
    action: 'See if you qualify',
  },
  {
    group: 'Call',
    title: 'DSS OneNumber',
    detail: 'HASA ServiceLine and HRA rental assistance. Weekdays. Call 311 for other city services. Call 911 in an emergency.',
    href: 'tel:718-557-1399',
    action: 'Call 718-557-1399',
  },
  {
    group: 'Call',
    title: 'ACCESS HRA',
    detail: 'Apply for SNAP or Cash Assistance, check a case, or send a CityFHEPS renewal. No LeasePath sign-in.',
    href: ACCESS_HRA_URL,
    action: 'Open ACCESS HRA',
  },
]
