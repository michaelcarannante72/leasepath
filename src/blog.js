export const POSTS = [
  {
    slug: 'ask-before-you-tour',
    title: 'Ask this before you tour',
    date: '2026-10-02',
    excerpt: 'A listing that says it takes a voucher still has to match the program on your letter. Ask which program, who pays the utilities, and who confirms the rent.',
    body: [
      'Start with the program named on your letter. HASA, CityFHEPS, and Section 8 are not interchangeable, and a broker’s “voucher OK” can mean only one of them.',
      'Ask whether the rent includes heat, hot water, and electricity. A utility you pay can change the amount a worker can approve.',
      'Ask who will confirm the apartment: the broker, the landlord, and your worker. LeasePath can line up the asking rent with the figure on your letter. It cannot approve the apartment.',
    ],
  },
  {
    slug: 'hunt-from-the-letter',
    title: 'Hunt from the letter, not the ad',
    date: '2026-09-18',
    excerpt: 'Put the monthly amount from your letter next to the asking rent before you call. The ad is the invitation. The letter is the limit you can actually discuss.',
    body: [
      'Write down the monthly amount on your letter before you open a listing. If the asking rent is higher, you already know the first question for the broker.',
      'Sample apartments in LeasePath are practice listings. Use them to rehearse the comparison. A real apartment still has to be confirmed with the broker and your worker.',
      'Save the ones you want to revisit. Saving stays on this phone. It does not send an application.',
    ],
  },
  {
    slug: 'three-different-doors',
    title: 'Three programs, three doors',
    date: '2026-09-04',
    excerpt: 'HASA, CityFHEPS, and Section 8 start in different places. If you do not have a voucher yet, do not wait on a listing to tell you where to apply.',
    body: [
      'CityFHEPS and Cash Assistance applications go through ACCESS HRA. A community application for CityFHEPS or FHEPS can also go through Homebase.',
      'A new HASA application is by phone. Call HASA ServiceLine at 718-557-1399, weekdays 9am to 5pm.',
      'Section 8 depends on the agency that issued your voucher. Use the paperwork from that agency for the rent share. LeasePath does not keep a Section 8 payment chart.',
    ],
  },
]

export function formatPostDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${names[month - 1]} ${day}, ${year}`
}
