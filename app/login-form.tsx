"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

type Channel = "email" | "phone";
const DEMO_OTP = "123456";

export default function LoginForm() {
  const [channel, setChannel] = useState<Channel>("phone");
  const [identity, setIdentity] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"identity" | "otp">("identity");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    // Supabase sends the real OTP when the project credentials and provider are configured.
    try {
      const supabase = createClient();
      const destination = channel === "email" ? { email: identity } : { phone: identity };
      await supabase.auth.signInWithOtp(destination);
    } catch {
      // Keep the demo flow usable before Supabase environment variables are added.
    }

    setStep("otp");
    setIsLoading(false);
    setMessage(`Demo code sent to ${identity}`);
  }

  function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (code !== DEMO_OTP) {
      setMessage("That code is not right. Try the demo code 123456.");
      return;
    }

    // Temporary demo session. Replace with Supabase verifyOtp before production.
    sessionStorage.setItem("nolimit-demo-user", identity);
    router.push("/dashboard");
  }

  if (step === "otp") {
    return (
      <form className="login-form" onSubmit={verifyCode}>
        <div className="sent-note"><span className="check-mark">✓</span><span>Code sent to<br /><strong>{identity}</strong></span></div>
        <label htmlFor="otp">Six-digit access code</label>
        <input className="otp-input" id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} required />
        {message && <p className="form-message" role="alert">{message}</p>}
        <button type="submit" disabled={code.length !== 6}><span>Unlock mission</span><span className="arrow" aria-hidden="true">↗</span></button>
        <div className="form-actions"><button type="button" className="text-button" onClick={() => { setStep("identity"); setMessage(""); }}>← Change destination</button><button type="button" className="text-button" onClick={() => setMessage("Demo code: 123456")}>Resend code</button></div>
      </form>
    );
  }

  return (
    <form className="login-form" onSubmit={requestCode}>
      <div className="channel-tabs" role="tablist" aria-label="Code delivery method">
        {(["phone", "email"] as Channel[]).map((item) => <button type="button" role="tab" aria-selected={channel === item} className={channel === item ? "channel active" : "channel"} onClick={() => setChannel(item)} key={item}>{item === "phone" ? "Phone number" : "Email"}</button>)}
      </div>
      <label htmlFor="identity">{channel === "phone" ? "Mobile number" : "Email address"}</label>
      <div className="input-wrap"><span className="input-icon" aria-hidden="true">{channel === "phone" ? "+" : "@"}</span><input id="identity" name="identity" type={channel === "phone" ? "tel" : "email"} autoComplete={channel === "phone" ? "tel" : "email"} placeholder={channel === "phone" ? "+1 555 000 0000" : "you@yourmail.com"} value={identity} onChange={(event) => setIdentity(event.target.value)} required /></div>
      {message && <p className="form-message form-success" role="status">{message}</p>}
      <button type="submit" disabled={isLoading}><span>{isLoading ? "Sending code..." : "Send me a code"}</span><span className="arrow" aria-hidden="true">↗</span></button>
      <p className="signup-prompt">No account needed. Just bring your curiosity.</p>
    </form>
  );
}
