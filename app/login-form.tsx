"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export default function LoginForm() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function signInAnonymously() {
    setIsLoading(true);
    setMessage("");
    const { error } = await createClient().auth.signInAnonymously();
    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="login-form">
      {message && <p className="form-message" role="alert">{message}</p>}
      <button type="button" onClick={signInAnonymously} disabled={isLoading}>
        <span>{isLoading ? "Opening..." : "Enter the style hunt"}</span>
        <span className="arrow" aria-hidden="true">↗</span>
      </button>
      <p className="signup-prompt">No account or password needed. Just bring your curiosity.</p>
    </div>
  );
}
