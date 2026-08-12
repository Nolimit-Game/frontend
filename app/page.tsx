import LoginForm from "./login-form";
import Image from "next/image";

export default function Home() {
  return (
    <main className="hunt-page">
      <div className="noise" aria-hidden="true" />
      <div className="orbit orbit-one" aria-hidden="true" />
      <div className="orbit orbit-two" aria-hidden="true" />
      <header className="topbar">
        <div className="brand-lockup">
          <div className="logo-frame" aria-hidden="true">
            <span className="logo-fallback">N</span>
            <Image src="/logo.png" alt="NoLimit" width={130} height={20} className="logo-image" priority />
          </div>
        </div>
        <span className="event-tag">GRAND OPENING <i>·</i> 01</span>
      </header>
      <section className="mission-layout" aria-label="Join the scavenger hunt">
        <div className="mission-copy">
          <div className="eyebrow"><span className="status-dot" /> The city is your map</div>
          <h1>Find the<br /><em>signal.</em></h1>
          <p className="intro">A new NoLimit store is about to open. Follow the clues, unlock the drops, and be first through the door.</p>
          <div className="clue-stamp"><span>CLUE 00</span><strong>ACCESS REQUIRED</strong></div>
        </div>
        <div className="pass-card"><span className="card-corner corner-tl" /><span className="card-corner corner-br" /><div className="card-kicker">{"// ENTER THE HUNT"}</div><h2>Get your<br /><span>mission pass.</span></h2><p className="card-copy">We&apos;ll send a one-time code to your phone or inbox.</p><LoginForm /><p className="terms">By joining, you agree to the <a href="#terms">hunt rules</a> and <a href="#privacy">privacy policy</a>.</p></div>
      </section>
      <footer className="page-footer"><span>NO LIMITS. NO ORDINARY.</span><span className="footer-line" /><span>SCROLL TO DISCOVER <b>↓</b></span></footer>
    </main>
  );
}
