import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="login-page">
      <div className="promo-strip">SIGN UP AND GET 10% OFF ON YOUR FIRST ORDER <span>•</span> THE NO LIMIT STYLE HUNT IS NOW OPEN</div>
      <div className="login-brand brand-lockup">
        <div className="logo-frame"><img className="logo-image" src="/logo.png" alt="NoLimit" /></div>
        <span>FASHION / LIFESTYLE / HOME</span>
      </div>
      <section className="login-card">
        <span className="login-kicker">NOLIMIT PRESENTS / 01</span>
        <h1>Find your<br /><em>next favourite.</em></h1>
        <p className="login-intro">A little game of discovery, inspired by the way you shop. Follow the clues and explore the store for your next favourite piece.</p>
        <LoginForm />
      </section>
      <div className="login-footer"><span>WOMEN / MEN / KIDS / HOME</span><span>CURATED IN SRI LANKA</span></div>
    </main>
  );
}
