import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="login-page">
      <div className="login-brand">NoLimit <span>MISSION ACCESS</span></div>
      <section className="login-card">
        <span className="login-kicker">{"// PLAYER ACCESS"}</span>
        <h1>Find your<br /><em>next signal.</em></h1>
        <p className="login-intro">Enter the mission instantly. No email, password, or account required.</p>
        <LoginForm />
      </section>
    </main>
  );
}
