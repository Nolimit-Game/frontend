import LoginForm from "./login-form";

export default function Home() {
  return (
    <main className="login-page">
      <div className="login-brand">NoLimit <span>MISSION ACCESS</span></div>
      <section className="login-card">
        <span className="login-kicker">{"// PLAYER ACCESS"}</span>
        <h1>Find your<br /><em>next signal.</em></h1>
        <p className="login-intro">Enter your email and we&apos;ll send a one-time access code for the mission.</p>
        <LoginForm />
      </section>
    </main>
  );
}
