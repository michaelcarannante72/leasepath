/** Navy hero band shared by Steps and Resources: matches the homepage hero (gradient, gold glow, skyline). */
export function PageSkyline() {
  return (
    <svg className="page-hero-skyline" viewBox="0 0 390 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path className="sky-far" d="M0 120V70h18V52h14v18h10V40h8v-8h6v8h8v30h12V58h22v62zM120 120V46h10V30h4V14h4v16h4v16h10v74zM200 120V60h16V44h20v16h14V36h8V24h6v12h8v84zM290 120V54h12V40h18v14h10V64h20V48h12v72z" />
      <g className="sky-windows">
        <rect x="128" y="52" width="4" height="6" /><rect x="136" y="64" width="4" height="6" /><rect x="222" y="66" width="4" height="6" /><rect x="300" y="62" width="4" height="6" /><rect x="24" y="76" width="4" height="6" />
      </g>
    </svg>
  )
}

export function PageHero({ eyebrow, title, id, children, aside }) {
  return (
    <header className="page-hero" aria-labelledby={id}>
      <PageSkyline />
      <div className="page-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id={id}>{title}</h1>
        {children}
      </div>
      {aside && <div className="page-hero-aside">{aside}</div>}
    </header>
  )
}
