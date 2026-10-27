/** Youth and LGBTQ+ housing help. Ages and phones only when published on the cited official pages. */

export const SOURCES = {
  dycdCrisis: {
    label: 'DYCD — Crisis Services Programs (Runaway & Homeless Youth)',
    href: 'https://www.nyc.gov/site/dycd/services/runaway-homeless-youth/crisis-services-programs.page',
  },
  dycdRhy: {
    label: 'DYCD — Runaway and Homeless Youth',
    href: 'https://www.nyc.gov/site/dycd/services/runaway-homeless-youth/runaway-homeless-youth.page',
  },
  acsHousing: {
    label: 'ACS — Housing Services for Youth',
    href: 'https://www.nyc.gov/site/acs/youth/housing-services-for-youth.page',
  },
}

export const RESOURCES = [
  {
    id: 'dycd-crisis',
    title: 'DYCD crisis shelters for runaway and homeless youth',
    body: 'DYCD-funded crisis programs provide emergency shelter and crisis help, including sites that welcome LGBTQ+ youth. DYCD’s crisis page lists borough programs and phones. You may qualify — the program decides intake.',
    phones: [],
    href: SOURCES.dycdCrisis.href,
    sourceId: 'dycdCrisis',
    tags: ['runaway', 'homeless youth', 'shelter'],
  },
  {
    id: 'ali-forney',
    title: 'Ali Forney Center (DYCD-listed)',
    body: 'Listed on DYCD’s crisis services page for runaway and homeless youth and homeless young adults, including LGBTQ+-affirming drop-in and shelter referrals. Phone from the DYCD page.',
    phones: [{ number: '212-206-0574' }],
    href: SOURCES.dycdCrisis.href,
    sourceId: 'dycdCrisis',
    tags: ['LGBTQ+', 'drop-in', 'shelter'],
  },
  {
    id: 'covenant-house',
    title: 'Covenant House (DYCD-listed, Manhattan)',
    body: 'Listed on DYCD’s crisis services page (Manhattan). Mother and child welcome per that listing. Phone from the DYCD page.',
    phones: [{ number: '212-613-0300' }],
    href: SOURCES.dycdCrisis.href,
    sourceId: 'dycdCrisis',
    tags: ['shelter', 'crisis'],
  },
  {
    id: 'safe-horizon-streetwork',
    title: 'Safe Horizon Streetwork Harlem (DYCD-listed)',
    body: 'Listed on DYCD’s crisis services page. Phone from that page.',
    phones: [{ number: '917-507-1562' }],
    href: SOURCES.dycdCrisis.href,
    sourceId: 'dycdCrisis',
    tags: ['streetwork', 'crisis'],
  },
  {
    id: 'acs-hac',
    title: 'ACS Housing Academy Collaborative',
    body: 'ACS helps youth leaving foster care prepare for housing. Walk-in at 110 William Street, New York, NY 10038, weekdays 9:00 a.m. to 4:00 p.m. Hotline from the ACS housing page. Ages served are listed on that official page — we do not invent ranges here beyond what ACS publishes.',
    phones: [{ number: '212-676-2818' }],
    href: SOURCES.acsHousing.href,
    sourceId: 'acsHousing',
    tags: ['foster care', 'ACS'],
  },
  {
    id: 'nyny3',
    title: 'New York / New York III supportive housing',
    body: 'ACS describes NY/NY III supportive housing for youth leaving or recently leaving foster care (eligibility details, including ages ACS publishes, are on the ACS housing page). Apply only through your caseworker via HRA’s CAPS system — LeasePath cannot file it.',
    phones: [],
    href: SOURCES.acsHousing.href,
    sourceId: 'acsHousing',
    tags: ['supportive housing', 'foster care'],
  },
]
