"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setIsLoading(true);
    setMessage("");

    const { error } = await createClient().auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    setStep("otp");
    setIsLoading(false);
    setEmail(normalizedEmail);
    setCode("");
    setMessage(`A verification code was sent to ${normalizedEmail}`);
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const { error } = await createClient().auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: "email",
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  if (step === "otp") {
    return (
      <form className="login-form" onSubmit={verifyCode}>
        <div className="sent-note"><span className="check-mark">✓</span><span>Code sent to<br /><strong>{email}</strong></span></div>
         <label htmlFor="otp">Eight-digit access code</label>
         <input className="otp-input" id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" minLength={8} maxLength={8} placeholder="00000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} required />
        {message && <p className="form-message" role="alert">{message}</p>}
         <button type="submit" disabled={isLoading || code.length !== 8}><span>{isLoading ? "Verifying..." : "Unlock mission"}</span><span className="arrow" aria-hidden="true">↗</span></button>
        <div className="form-actions"><button type="button" className="text-button" onClick={() => { setStep("email"); setMessage(""); }}>← Change email</button><button type="button" className="text-button" onClick={() => requestCode({ preventDefault: () => undefined } as FormEvent<HTMLFormElement>)}>Resend code</button></div>
      </form>
    );
  }

  return (
    <form className="login-form" onSubmit={requestCode}>
      <label htmlFor="email">Email address</label>
      <div className="input-wrap"><span className="input-icon" aria-hidden="true">@</span><input id="email" name="email" type="email" autoComplete="email" placeholder="you@yourmail.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      {message && <p className="form-message" role="alert">{message}</p>}
      <button type="submit" disabled={isLoading}><span>{isLoading ? "Sending code..." : "Send me a code"}</span><span className="arrow" aria-hidden="true">↗</span></button>
      <p className="signup-prompt">No password needed. Just bring your curiosity.</p>
    </form>
  );
}
