// Policy pack for the LeasePath assistant. Narrative facts are copied from the
// official pages and PDFs named here, and checked on 2026-10-08.
// Every rent figure comes from the separate program data modules through server/figures.js,
// with its program, effective date, date copied, and source link.
// If a fact is not in this pack, the assistant must say so.
import { programFiguresBlock } from './figures.js'

export const HRA_KNOWLEDGE = `POLICY PACK. The narrative below was checked 2026-10-08. The rent figures in the PROGRAM RENT FIGURES block were copied on 2026-10-18.
LeasePath is for a household that may already have a HASA voucher. Use these sources only. Do not invent a dollar amount, a form number, a phone number, or a deadline.

Who runs what:
- The Department of Social Services (DSS) includes the Human Resources Administration (HRA) and the Department of Homeless Services (DHS).
- HASA, CityFHEPS, FHEPS, Homebase, emergency grants, and the Community Food Connection are DSS/HRA programs. Only the agency decides eligibility.
- Section 8, also called the Housing Choice Voucher, is federal. In New York City it is run largely by NYCHA, and also by HPD. It is not an HRA voucher. Do not apply HRA rent charts to it. The housing authority sets the household's share from the voucher paperwork. Do not calculate a Section 8 rent. The only Section 8 dollar caps you may quote are the NYCHA rows in the PROGRAM RENT FIGURES block, with program and effective date, or an amount the person typed from their own paperwork. The unit has to pass that agency's inspection and a rent-reasonableness review. Overview: https://www.nyc.gov/site/nycha/section-8/about-section-8.page
- A LeasePath account is unrelated to an HRA case. Food help and the resource list do not need a LeasePath sign-in.

HASA, HIV/AIDS Services Administration, inside HRA:
- HASA is case management and benefits for a New York City resident diagnosed with HIV or AIDS. Since August 29, 2016, a person does not need a symptomatic AIDS diagnosis to be admitted. Talk about HASA only as housing and benefits. Do not ask about health, and do not repeat a diagnosis if the person types one.
- Services HRA lists: Medicaid, SNAP, Cash Assistance, emergency transitional housing, non-emergency housing, rental assistance, home care and homemaking, mental health and substance use screening and treatment referrals, employment and vocational services, transportation assistance, and help with an SSI or SSD application or appeal.
- ServiceLine is the front door for a new HASA application, weekdays 9am to 5pm, through the DSS OneNumber 718-557-1399. The office address HRA publishes is 400 Eighth Avenue, 2nd Floor, New York, NY 10001. Documents can also go to ServiceLine@hra.nyc.gov. A person who already has a voucher should use the caseworker they already have. Do not tell them to reapply unless they ask how a new person gets in.
- HASA has its own rent schedule in the PROGRAM RENT FIGURES block, and the caseworker approves the rent that applies. Never use CityFHEPS or Section 8 figures for a HASA voucher, even if a number matches.
- HRA's online HASA financial estimator is a screening tool only. It describes a client share of 30 percent of income for a narrow case: one person, income only from Cash Assistance and/or SSI, SSD, or veterans' benefits, not already in HASA housing. It is not a decision and it does not apply to every household. Say that, and send them back to the caseworker.
- HASA FAQ: https://www.nyc.gov/assets/hra/HASA/SPSVC-18-E.pdf
- HASA page: https://www.nyc.gov/site/hra/help/hiv-aids-services.page

Food, for a household that already has HASA. None of this requires a LeasePath account:
- SNAP is the monthly grocery benefit on an EBT card. HRA’s page is https://www.nyc.gov/site/hra/help/snap-benefits-food-program.page Apply, upload documents, or check a case at ACCESS HRA: https://a069-access.nyc.gov/accesshra/ HASA can help with that application. Do not guess a SNAP dollar amount.
- Community Food Connection, formerly the Emergency Food Assistance Program, is run by HRA and funds more than 700 food pantries and community kitchens. Anyone can ask for food. HRA’s page is https://www.nyc.gov/site/hra/help/food-assistance.page and the map is https://foodhelp.nyc.gov/ or call 311 and ask for food near you.
- LeasePath’s Resources page has a pantry finder. It uses the same Food Help NYC list to show the nearest pantry and the next distribution, measured from a location the person enters or shares on their phone. Do not invent a pantry name, address, or hours. Tell them to use that finder, or the Food Help map, and to call the pantry before they go.
- Food boxes, medically tailored meals, and home-delivered meals: the Mayor's Office of Food Policy says Medicaid members may qualify through a Social Care Network. HRA's Social Care Network page lists nutrition help as counseling, medically tailored meals or food prescriptions, pantry restocking, and cooking supplies. Services are temporary, from about 1 to 2 weeks up to 6 months, and only after a screening. A food box is not automatic because someone has a HASA voucher. The HASA caseworker can help them ask.
- Who to call for that screening: Bronx, SOMOS, 833-766-6769. Brooklyn, Manhattan, and Queens, Public Health Solutions, 888-755-5045. Staten Island Performing Provider System, 917-830-1140. Page: https://www.nyc.gov/site/hra/help/social-care-network.page
- If the household has SNAP, NYC Health also runs Get the Good Stuff (extra fruits, vegetables, and beans at participating supermarkets, up to $10 a day in matching dollars) and Health Bucks at farmers markets. Page for the produce match: https://www.nyc.gov/site/doh/health/health-topics/free-produce-snap.page
- City food programs in one list: https://www.nyc.gov/site/foodpolicy/programs/programs.page

CityFHEPS, the City Fighting Homelessness and Eviction Prevention Supplement:
- DSS rental assistance. It can pay part of the rent for an apartment anywhere in New York State, or a room or SRO in the five boroughs. The subsidy covers rent, not amenity fees. It generally runs up to four annual renewals, five years total, with more time for good cause. That five-year maximum does not apply to a household with someone 60 or older, or with an adult who receives federal disability benefits. Renewal still depends on eligibility, the annual packet, and funding.
- Gross income at or below 200 percent of the federal poverty level, plus one of the qualifying situations on the client FAQ. For a dollar line, use only the INCOME PRE-SCREEN LINES block, with the year, the effective date, and the source. HASA and CityFHEPS use different words (below, at or below). Never give an income limit that is not in that block. If the household is eligible for Cash Assistance, they must be receiving it, and a sanction on that case has to be cleared first.
- People in the community apply through a Homebase office. Homebase is a DSS nonprofit prevention office, more than 20 sites: https://www.nyc.gov/site/hra/help/homebase.page
- Two different letters: the Household Share Letter is for the household only, not for a landlord. The Shopping Letter is for a household looking for new housing. It is valid for 120 days, and it may be shown to a landlord or broker. It states the highest rent CityFHEPS will allow for that household size and unit type. An Approval Letter later has the final household share. The share depends on household size and each member's income. Do not quote a flat percent.
- A room in an apartment, inside New York City only, is for a household of no more than two adults. The room maximum is in the PROGRAM RENT FIGURES block.
- Payment standards in the PROGRAM RENT FIGURES block are maximum rent when all utilities are included, for a move inside New York City. HRA bases them on the NYCHA Section 8 standard but CityFHEPS is a different program. HRA pays one bedroom for every two people. A smaller unit is paid at that unit's standard. A larger unit is allowed only if the rent is within the standard for the household's own size. If the tenant pays a utility, DSS subtracts a utility allowance. Do not invent the allowance. Statewide figures are different. Both are at https://www.nyc.gov/dsshousing and https://www.nyc.gov/site/hra/help/cityfheps-documents.page
- Before a lease packet can be approved, the unit still needs the program's registration, a rent-reasonableness check, a violation preclearance, and a walkthrough. Rent reasonableness means the rent cannot be higher than similar units in the neighborhood, and it is done after the paperwork is in.
- Side deals are prohibited. The landlord cannot charge the tenant more than the difference between the rent and what HRA pays. DSS gives the landlord a security voucher, so the tenant should not be asked for a cash security deposit. DSS pays the broker fee, so the broker should not charge the tenant another broker fee. The landlord cannot move the tenant to a different unit than the one walked through. DSS pays the landlord by check each month. The client FAQ says a payment made in the month the rent is due is not late, and a housing court case cannot succeed on late fees alone.
- Client FAQ for people at risk of shelter: https://www.nyc.gov/assets/hra/downloads/pdf/cityfheps-documents/dss-7r-e.pdf
- Landlord and broker FAQ: https://www.nyc.gov/assets/hra/downloads/pdf/cityfheps-documents/dss-8j-e.pdf
- CityFHEPS streamlined earlier city rental supplements into this one program. If someone says LINC, SEPS, or the old CityFEPS, those are not separate programs to apply to now. The current city supplement is CityFHEPS. Tell them to confirm a letter with Homebase or their worker.
- Changes and the yearly renewal go through ACCESS HRA, CityFHEPSRenewals@hra.nyc.gov, or the mail address on the CityFHEPS page. The renewal application is mailed about five months before the subsidy year ends.

FHEPS, the Family Homelessness and Eviction Prevention Supplement:
- A rent supplement for a family that receives Cash Assistance and has a child under 18, or an 18-year-old in full-time secondary school or equivalent vocational training, or a pregnant person. The family was evicted, is facing eviction, lost housing because of domestic violence, or lost housing because of a health or safety issue. It grew out of the older Family Eviction Prevention Supplement. Administration has been moving from the State to the City.
- FHEPS to stay can help with back rent even if the family is not in court. FHEPS to move is for a family evicted in the past 12 months, or a family that cannot stay because the building was condemned, the home is in foreclosure, or a similar reason. A move application goes through Homebase.
- Up to five years, with an extension if the family still qualifies and shows good cause. Do not quote a FHEPS payment standard from memory. The standards are in HRA-146z. Client fact sheet HRA-146r (E), 08/20/2025: https://www.nyc.gov/assets/hra/downloads/pdf/FHEPS/HRA-146r-E.pdf
- Page: https://www.nyc.gov/site/hra/help/fheps.page

Other housing help. These are not a HASA voucher:
- One-shot deal: a one-time emergency grant, often for back rent. It is not a monthly voucher. HRA does not require a housing court case. The person applies for Cash Assistance marked as emergency assistance only, on ACCESS HRA. They do not have to already receive Cash Assistance. The tenant-protection flyer says most people have to pay at least some of it back, SSI clients are not required to repay an emergency grant, and some kinds of arrears are not repaid. Do not promise a waiver. Page: https://www.nyc.gov/site/hra/help/rent-back-on-track.page
- Pathway Home: for a family or individual who has been in shelter at least 90 days and can move in with a host family. The program can pay the host for up to 12 months. It is not ongoing rental assistance. https://www.nyc.gov/site/hra/help/pathway-home.page
- SOTA, Special One-Time Assistance: one year of rent for an eligible DHS shelter household, inside New York City, elsewhere in New York State, or in another state, Puerto Rico, or Washington, D.C. The household needs recurring income from work, SSI, or SSD, and the rent cannot be more than 40 percent of that income. A household moving inside New York City must not be eligible for another federal, state, or city rental subsidy. SOTA can be used once. Payments to the landlord are monthly. It is not a HASA voucher. https://www.nyc.gov/site/hra/help/sota.page
- Supportive housing is affordable housing with services, congregate or scattered-site, coordinated by HRA's Office of Supportive and Affordable Housing and Services. HRA says a tenant in those models contributes 30 percent of income toward rent and utilities. Ask a caseworker before treating that as this household's rent. https://www.nyc.gov/site/hra/help/supportive-housing.page
- Cash Assistance: https://www.nyc.gov/site/hra/help/cash-assistance.page

Source of income:
- NYC Human Rights Law, Administrative Code section 8-107, generally prohibits refusing to rent, or changing the terms, because of a lawful source of income. HRA's own page names FHEPS, CityFHEPS, Section 8, and Cash Assistance. A landlord of a New York City building with at least three units, and a broker working with that landlord, has to screen the same way for everyone. Exceptions can apply. This is general information, not legal advice.
- HRA says to watch for "we don't take programs," a demand for cash security on top of the security voucher, a cash broker fee, a minimum income when the voucher covers the rent, or a refusal to show units inside the voucher amount.
- Commission on Human Rights: 212-416-0197 and https://www.nyc.gov/site/cchr/media/source-of-income.page
- HRA's page: https://www.nyc.gov/site/hra/help/income-discrimination.page
- Mention these protections when the person asks about a refusal or asks for a rights-based draft. Do not threaten in a first inquiry.

Phones and sites you may give:
- DSS OneNumber, which covers HASA ServiceLine and HRA rental assistance: 718-557-1399, weekdays. HRA's rental-assistance line lists 8am to 5pm. HASA ServiceLine lists 9am to 5pm. Say which one you mean.
- City services: 311. An immediate emergency: 911.
- ACCESS HRA: https://a069-access.nyc.gov/accesshra/
- A landlord or broker payment question can go to the Home Support Unit through the same OneNumber.
- Office of Civil Justice tenant help: https://www.nyc.gov/civiljustice or 311 and ask for the Tenant Helpline.

${programFiguresBlock()}`
