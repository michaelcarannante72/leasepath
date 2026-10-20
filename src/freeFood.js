// Community resources on #/resources: free food and clothing from volunteer groups, plus housing, getting
// around, health and support, and help for older New Yorkers. Facts only, in LeasePath's own words. Only
// links to a group's own page that we were given go in `link` / `links`. ADDED_ON is the date these were added.

export const FREE_FOOD_TITLE = 'Free food and clothing'
export const FREE_FOOD_LABEL = 'Run by volunteers, not a government agency. Check their page before you go.'
export const FREE_FOOD_CAUTION = 'Times can change, check with the group before you go.'
export const ADDED_ON = 'Oct 20, 2026'

export const FREE_FOOD = [
  {
    name: 'Bushwick Free Store',
    group: 'Bushwick Mutual Aid',
    when: 'Tuesdays, 3 to 5pm',
    where: 'Maria Hernandez Park, Suydam St and Knickerbocker Ave, Brooklyn 11237',
    offers: 'Food and clothing. Bring something to share or just take what you need.',
    note: 'Updates and cancellations are posted on Instagram: @bushwickfreestore',
  },
  {
    name: 'Community Care Collective',
    group: 'Community Care Collective',
    when: 'Tuesdays, 12:30 to 2:30pm',
    where: 'Washington Square Park, across from the Holley statue, Manhattan 10012',
    offers: 'Food, hot coffee, and other supplies.',
    centers: 'People who are unhoused',
  },
  {
    name: 'Collective Focus Resource Hub',
    group: 'Collective Focus',
    when: 'Tuesdays, 12 to 2pm',
    where: '1046 Broadway, Brooklyn 11221',
    offers: 'Free food for anyone who comes.',
    centers: 'People who are unhoused or low income',
  },
  {
    name: 'Bronx Mutual Aid',
    group: 'Bronx Mutual Aid',
    when: 'Saturdays, 1 to 2pm',
    where: "St. Mary's Park, 601 E 149th St, Bronx 10454",
    offers: 'Fresh produce, hot food, clothing, books, and toiletries.',
  },
  {
    name: 'Washington Square Park Mutual Aid',
    group: 'Washington Square Park Mutual Aid',
    when: 'Fridays, from 5pm',
    where: 'Washington Square Park, Manhattan 10012',
    offers: 'Food, clothes, and supplies.',
    centers: 'People who are unhoused or low income',
  },
  {
    name: "Marsha's Closet",
    group: 'Claim Our Space NOW',
    when: 'Third Monday of each month',
    where: '135th St and St Nicholas Ave, Harlem 10030',
    offers: 'Gender-affirming clothing. Drop off or pick up.',
    centers: 'LGBTQIA2+ and unhoused New Yorkers',
    email: 'admin@claimourspacenow.org',
    link: 'https://www.instagram.com/claimourspacenow/',
  },
  {
    name: 'Adelphi Free Store',
    group: 'Adelphi Free Store',
    when: 'Open 24/7',
    where: 'Adelphi St and Greene Ave (380 Adelphi St), Clinton Hill/Fort Greene, Brooklyn 11238',
    offers: 'Clothing, linens, toys, and home goods.',
  },
  {
    name: 'Community Solidarity',
    group: 'Community Solidarity',
    when: 'Weekly. Check their website for times.',
    where: 'Bed-Stuy, Brooklyn',
    offers: 'Free groceries.',
  },
  {
    name: 'Mercadito Solidario Project',
    group: 'Colectivo Intercultural TRANSgrediendo',
    when: 'Wednesdays, 3 to 6pm',
    where: '3763 83rd St, Suite 1B, Jackson Heights, Queens 11372',
    offers: 'Free fresh food.',
    centers: 'Trans and gender-nonbinary (TransGNB) people',
    phone: '(347) 738-6989',
    link: 'https://www.ourvoicesarefree.org/calendar',
  },
  {
    name: 'Young Black Queens NYC',
    group: 'Young Black Queens NYC',
    when: 'Check with the group for dates.',
    where: 'Brooklyn and Queens',
    offers: 'Hygiene products, clothing, food help, events, and mutual aid.',
    centers: 'Black women',
    link: 'https://www.instagram.com/ybq.nyc/',
  },
]

export const OTHER_HELP_TITLE = 'Getting around'

export const OTHER_HELP = [
  {
    name: 'Bike Plant',
    group: 'Bike Plant',
    where: 'Brooklyn',
    offers: 'Bikes and bike repairs on a sliding scale.',
    how: 'See their page for how to get on the bike list.',
    phone: '(347) 240-2466',
    link: 'https://www.bikeplant.net/repair-fund',
  },
]

export const SOURCE_CREDIT = {
  before: 'Listings gathered from ',
  text: 'Mutual Aid NYC resources',
  href: 'https://resources.mutualaid.nyc',
  after: ', rewritten by LeasePath.',
}

export const HEALTH_TITLE = 'Health and support'

export const HEALTH = [
  {
    name: 'COIN at Callen-Lorde',
    group: 'Callen-Lorde',
    offers: 'A free health care program for sex workers: primary care, sexual health, HIV treatment and prevention, transgender health, and GYN care.',
    how: 'Call 212-271-8134 to make an appointment.',
    phone: '212-271-8134',
    link: 'https://callen-lorde.org/coin/',
  },
  {
    name: 'Abortion Finder',
    group: 'Abortion Finder',
    offers: 'A national directory you can search for abortion care providers, funding, and support.',
    how: 'It does not make referrals or give care itself. Use it to find a provider, then contact them.',
    link: 'https://www.abortionfinder.org/',
  },
  {
    name: 'PartySafe Medics',
    group: 'PartySafe Medics',
    lead: 'Paid service, sliding-scale rates. You hire them to staff events; not a free clinic.',
    offers: 'Harm-reduction medics for events. They teach safer drug use, give first aid, and work to prevent overdoses. Their medics carry naloxone, drug testing strips, safer use supplies, sexual health and hygiene products, oxygen, and more.',
    how: 'Text, Signal, or WhatsApp 929-326-2152. Email partysafemedics@gmail.com. Instagram: @partysafemedics.',
    phone: '929-326-2152',
    email: 'partysafemedics@gmail.com',
    link: 'https://www.partysafemedics.nyc/',
  },
  {
    name: 'Identity House',
    group: 'Identity House',
    offers: 'LGBTQ+ affirming peer counseling and support groups. Counselors can refer you to short-term peer counseling or to professional therapists.',
    who: 'Any adult with questions about sexual orientation or gender identity and expression, including relationships and family.',
    when: 'Walk-in center Wednesdays 7 to 9pm and Saturdays 6 to 8pm. Virtual sessions by appointment on Sunday evenings.',
    cost: 'Free, or a $25 donation per session if you can afford it.',
    email: 'info@identityhouse.org',
    links: [
      { href: 'https://identityhouse.org/walk-in-center/', label: 'Walk-in center' },
      { href: 'https://identityhouse.org/groups/', label: 'Support groups' },
    ],
  },
  {
    name: 'ANAD Communities of Healing',
    group: 'ANAD',
    scope: 'National, online only.',
    offers: 'Free weekly virtual support groups for anyone with an eating disorder, led by people who have recovered.',
    how: 'Fill out their request form to join.',
    email: 'coh@anad.org',
    link: 'https://anad.org/get-help/about-our-support-groups/',
  },
]

export const HOUSING_TITLE = 'Housing and drop-in help'

export const HOUSING = [
  {
    name: 'Ali Forney Center',
    group: 'Ali Forney Center',
    offers: 'A 24-hour drop-in center for homeless LGBTQ+ youth, with free medical and mental health care and other services.',
    where: 'Drop-in center: 307 West 38th Street, 3rd floor, New York, NY 10018',
    when: 'New intakes Monday to Friday 8am to 8pm, Saturday and Sunday 10am to 6pm. Closed Wednesday 2 to 4pm.',
    who: 'See their site for who qualifies.',
    phone: '212-206-0574 ext. 100',
    link: 'https://www.aliforneycenter.org/',
  },
]

export const OLDER_TITLE = 'Older New Yorkers'

export const OLDER = [
  {
    name: 'R.A.I.N. Case Management Program',
    group: 'R.A.I.N.',
    lead: 'For homebound seniors 60+ living in Bronx Community Districts 7, 8, 11 or 12.',
    offers: 'Case managers connect you to transportation, housekeeping, home care, home-delivered meals, and help with entitlements and benefits.',
    phone: '718-892-5520',
    email: 'Info@RainInc.org',
    link: 'https://www.raininc.org/case-management/',
  },
  {
    name: 'AARP Connect2Affect',
    group: 'AARP',
    scope: 'National, online only.',
    offers: 'A three-minute online check of your risk for social isolation, with local suggestions based on your answers.',
    who: 'Adults 65+',
    link: 'https://connect2affect.org/',
  },
]

// Order on the page and in the jump links. `label: true` shows the volunteer label under the heading.
export const COMMUNITY_SECTIONS = [
  { id: 'free-food-title', title: FREE_FOOD_TITLE, jump: 'Food and clothing', items: FREE_FOOD, label: true, caution: true },
  { id: 'housing-title', title: HOUSING_TITLE, jump: HOUSING_TITLE, items: HOUSING },
  { id: 'other-help-title', title: OTHER_HELP_TITLE, jump: OTHER_HELP_TITLE, items: OTHER_HELP, label: true },
  { id: 'health-title', title: HEALTH_TITLE, jump: HEALTH_TITLE, items: HEALTH },
  { id: 'older-title', title: OLDER_TITLE, jump: OLDER_TITLE, items: OLDER },
]
