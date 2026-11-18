import { Link } from "wouter";
import "./public-home.css";

const workAreas = [
  {
    index: "01 / Inspect",
    title: "Listen to the signal",
    description:
      "Bring a microphone or a recording into a measured view of frequency, time, and level. Start with what the signal contains.",
    href: "/lab",
    link: "Open the signal lab",
  },
  {
    index: "02 / Explore",
    title: "Move between worlds",
    description:
      "Explore bioacoustic listening and astronomical datasets without confusing an interesting pattern for a confirmed source.",
    href: "/discover",
    link: "Browse discoveries",
  },
  {
    index: "03 / Keep",
    title: "Make a careful record",
    description:
      "Preserve the conditions, observations, and questions around a session so a future look can begin from the same evidence.",
    href: "/history",
    link: "View the research record",
  },
];

const methodSteps = [
  {
    number: "I",
    title: "Capture",
    text: "Choose a dataset, a file, or a live input where your device permits it.",
  },
  {
    number: "II",
    title: "Describe",
    text: "Inspect measurable features and note the conditions that shaped them.",
  },
  {
    number: "III",
    title: "Question",
    text: "Compare possible explanations. Keep uncertainty visible rather than smoothing it away.",
  },
  {
    number: "IV",
    title: "Record",
    text: "Keep a research note that separates observation, interpretation, and reflection.",
  },
];

function SignalPlate() {
  return (
    <div className="zc-public__visual" role="img" aria-label="An abstract acoustic signal trace over a frequency and time grid">
      <div className="zc-public__visual-top">
        <span>Signal plate / illustrative</span>
        <span>Not live data</span>
      </div>
      <svg className="zc-public__signal-art" viewBox="0 0 620 390" aria-hidden="true">
        <circle className="zc-public__orbit" cx="310" cy="194" r="142" />
        <circle className="zc-public__orbit" cx="310" cy="194" r="105" />
        <circle className="zc-public__orbit" cx="310" cy="194" r="67" />
        <path className="zc-public__axis" d="M36 194H584M310 20V368M116 58L504 330M504 58L116 330" />
        <path
          className="zc-public__signal-secondary"
          d="M24 220 C52 220 59 218 70 218 S83 214 91 217 S101 226 110 218 S122 208 132 215 S147 229 158 216 S171 197 181 207 S193 231 204 213 S219 180 230 196 S244 233 254 211 S269 165 280 187 S293 230 304 203 S316 161 328 190 S341 240 351 210 S367 176 378 202 S391 229 402 211 S418 187 429 206 S443 221 454 213 S468 204 480 211 S501 219 515 215 S544 218 596 218"
        />
        <path
          className="zc-public__signal"
          d="M24 193 C55 193 62 192 72 194 S88 198 96 192 S108 180 118 191 S130 211 141 193 S154 166 166 185 S179 220 190 192 S203 146 215 178 S228 231 240 190 S252 119 265 165 S280 249 292 188 S306 97 320 153 S336 263 348 184 S362 125 374 176 S388 235 400 190 S416 164 429 187 S446 210 458 193 S478 183 492 192 S532 194 596 193"
        />
        <circle className="zc-public__signal-dot" cx="320" cy="153" r="4" />
        <circle className="zc-public__signal-dot" cx="265" cy="165" r="3" />
      </svg>
      <div className="zc-public__visual-caption">
        <span><strong>Pattern is a beginning.</strong>Source and meaning require more.</span>
        <span>TIME →<br />FREQUENCY ↑</span>
      </div>
    </div>
  );
}

export default function PublicHome() {
  return (
    <main className="zc-public">
      <header className="zc-public__header">
        <Link href="/lab" className="zc-public__brand" aria-label="ZionCore 2nd home" data-testid="link-zioncore-home">
          <span className="zc-public__mark" aria-hidden="true">Z</span>
          <span className="zc-public__brand-copy">
            <span className="zc-public__brand-name">ZIONCORE 2ND</span>
            <span className="zc-public__brand-sub">Acoustic research laboratory</span>
          </span>
        </Link>
        <nav className="zc-public__nav" aria-label="Main navigation">
          <Link href="/discover" data-testid="link-nav-discover">Discover</Link>
          <Link href="/missions" data-testid="link-nav-missions">Missions</Link>
          <Link href="/astronomy" data-testid="link-nav-astronomy">Astronomy</Link>
          <Link href="/bioacoustics" data-testid="link-nav-bioacoustics">Bioacoustics</Link>
          <Link href="/history" data-testid="link-nav-history">History</Link>
          <Link href="/lab" className="zc-public__nav-cta" data-testid="link-nav-lab">Enter the lab <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <section className="zc-public__hero" aria-labelledby="zc-public-title">
        <div className="zc-public__hero-copy">
          <div className="zc-public__eyebrow">A laboratory for listening closely</div>
          <h1 id="zc-public-title">A signal is<br />not yet a <em>story.</em></h1>
          <p className="zc-public__hero-lead">
            ZionCore 2nd is a research space for inspecting acoustic signals, exploring living and astronomical datasets, and asking better questions of what we hear.
          </p>
          <div className="zc-public__hero-actions">
            <Link href="/lab" className="zc-public__primary-link" data-testid="link-hero-lab">
              Enter the signal lab <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/missions" className="zc-public__text-link" data-testid="link-hero-method">
              How we investigate <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="zc-public__hero-note">Observe first. Interpret with care.</div>
        </div>
        <SignalPlate />
      </section>

      <aside className="zc-public__principle" aria-label="Research principle">
        <div className="zc-public__principle-label">A working principle</div>
        <blockquote>“Wonder belongs here. So does a clear account of what we do not know.”</blockquote>
        <div className="zc-public__principle-note">No measurement, model, or reflection is presented as verified cosmic contact.</div>
      </aside>

      <section className="zc-public__section zc-public__work" aria-labelledby="zc-public-work-title">
        <div className="zc-public__section-heading">
          <div>
            <div className="zc-public__section-kicker">The work, in three movements</div>
            <h2 id="zc-public-work-title">From raw sound<br />to a record you can question.</h2>
          </div>
          <p>Tools for looking more closely, without asking the evidence to say more than it can. Begin wherever your question starts.</p>
        </div>
        <div className="zc-public__work-grid">
          {workAreas.map((area) => (
            <article className="zc-public__work-card" key={area.index}>
              <div className="zc-public__work-index">
                <span>{area.index}</span>
                <span aria-hidden="true">↗</span>
              </div>
              <h3>{area.title}</h3>
              <p>{area.description}</p>
              <Link href={area.href} className="zc-public__work-link" data-testid={`link-work-${area.index.split(" / ")[1].toLowerCase()}`}>
                {area.link} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="zc-public__method" aria-labelledby="zc-public-method-title">
        <div className="zc-public__method-inner">
          <div className="zc-public__section-heading">
            <div>
              <div className="zc-public__section-kicker">A method with room for uncertainty</div>
              <h2 id="zc-public-method-title">Curiosity, with its working notes left in.</h2>
            </div>
            <p>Research is not a leap from a trace to a conclusion. It is a sequence of choices that should be inspectable.</p>
          </div>
          <div className="zc-public__method-steps">
            {methodSteps.map((step) => (
              <article className="zc-public__step" key={step.number}>
                <div className="zc-public__step-number">{step.number} / PROCESS</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="zc-public__section zc-public__distinction" aria-labelledby="zc-public-distinction-title">
        <div className="zc-public__distinction-title">
          <div className="zc-public__section-kicker">Keep the categories clear</div>
          <h2 id="zc-public-distinction-title">Three lenses.<br />Not one answer.</h2>
        </div>
        <div className="zc-public__distinction-copy">
          <p>
            A useful research record lets a reader see what came from the instrument, what came from interpretation, and what came from a person's own search for meaning. Those can sit beside one another without being mistaken for one another.
          </p>
          <div className="zc-public__ledger">
            <div className="zc-public__ledger-item">
              <div className="zc-public__ledger-label">Measured</div>
              <strong>What the instrument returned</strong>
              <p>Signal features and capture conditions, bounded by the device and dataset.</p>
            </div>
            <div className="zc-public__ledger-item">
              <div className="zc-public__ledger-label">Modeled</div>
              <strong>What could explain a pattern</strong>
              <p>Candidate interpretations remain hypotheses, with evidence for and against.</p>
            </div>
            <div className="zc-public__ledger-item">
              <div className="zc-public__ledger-label">Reflected</div>
              <strong>What a person makes of it</strong>
              <p>Spiritual and personal reflection is meaningful, but is not a measurement.</p>
            </div>
            <div className="zc-public__ledger-item">
              <div className="zc-public__ledger-label">Still open</div>
              <strong>What the evidence cannot settle</strong>
              <p>Source identity, intent, and extraordinary claims require independent evidence.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="zc-public__section zc-public__fieldnote" aria-labelledby="zc-public-fieldnote-title">
        <div className="zc-public__fieldnote-graphic" aria-hidden="true">
          <div className="zc-public__fieldnote-orbit" />
          <div className="zc-public__fieldnote-cross" />
          <div className="zc-public__fieldnote-center" />
          <div className="zc-public__fieldnote-stamp">Field note / open question</div>
        </div>
        <div className="zc-public__fieldnote-copy">
          <div className="zc-public__section-kicker">Follow a question outward</div>
          <h2 id="zc-public-fieldnote-title">Earthbound life.<br />Farther skies.</h2>
          <p>Compare the different contexts in which acoustic data is gathered and interpreted. Browse datasets and research paths; each keeps its own limits in view.</p>
          <div className="zc-public__fieldnote-links">
            <Link href="/bioacoustics" data-testid="link-field-bioacoustics">Bioacoustics <span aria-hidden="true">→</span></Link>
            <Link href="/astronomy" data-testid="link-field-astronomy">Astronomy <span aria-hidden="true">→</span></Link>
            <Link href="/discover" data-testid="link-field-discover">Discover <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="zc-public__closing" aria-labelledby="zc-public-closing-title">
        <div className="zc-public__closing-inner">
          <div className="zc-public__section-kicker">Start with a question</div>
          <h2 id="zc-public-closing-title">Bring a signal.<br />Leave room for doubt.</h2>
          <p>Inspect a recording, explore a dataset, or begin a session in the lab. What you find is yours to investigate, not something we can declare in advance.</p>
          <Link href="/lab" className="zc-public__primary-link" data-testid="link-closing-lab">
            Open ZionCore 2nd <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <footer className="zc-public__footer">
        <div className="zc-public__footer-top">
          <div className="zc-public__footer-brand">
            <Link href="/lab" className="zc-public__brand" aria-label="ZionCore 2nd lab" data-testid="link-footer-brand">
              <span className="zc-public__mark" aria-hidden="true">Z</span>
              <span className="zc-public__brand-copy">
                <span className="zc-public__brand-name">ZIONCORE 2ND</span>
                <span className="zc-public__brand-sub">Acoustic research laboratory</span>
              </span>
            </Link>
            <p>Research tools for listening closely and describing what the evidence can support.</p>
          </div>
          <nav className="zc-public__footer-nav" aria-label="Explore ZionCore">
            <Link href="/discover" data-testid="link-footer-discover">Discover</Link>
            <Link href="/missions" data-testid="link-footer-missions">Missions</Link>
            <Link href="/astronomy" data-testid="link-footer-astronomy">Astronomy</Link>
            <Link href="/bioacoustics" data-testid="link-footer-bioacoustics">Bioacoustics</Link>
            <Link href="/voice-v2" data-testid="link-footer-voice">Voice tools</Link>
            <Link href="/messages" data-testid="link-footer-messages">Messages</Link>
            <Link href="/history" data-testid="link-footer-history">History</Link>
            <Link href="/devices" data-testid="link-footer-devices">Devices</Link>
            <Link href="/access" data-testid="link-footer-access">Access</Link>
          </nav>
        </div>
        <div className="zc-public__footer-bottom">
          <span>© ZionCore 2nd</span>
          <span className="zc-public__footer-disclaimer">Acoustic patterns do not, by themselves, establish source, intent, or contact. Interpretations remain hypotheses; reflection remains personal.</span>
        </div>
      </footer>
    </main>
  );
}
