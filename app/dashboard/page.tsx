"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [identity] = useState(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem("nolimit-demo-user") ?? "",
  );

  useEffect(() => {
    const savedIdentity = sessionStorage.getItem("nolimit-demo-user");
    if (!savedIdentity) router.replace("/");
  }, [router]);

  return (
    <main className="dashboard-page">
      <div className="dashboard-brand"><span className="status-dot" /> NoLimit / Mission control</div>
      <section className="dashboard-card">
        <span className="card-kicker">{"// PASS VERIFIED"}</span>
        <h1>You&apos;re<br /><em>in.</em></h1>
        <p>Your first clue is waiting. Keep this pass open while you explore the city.</p>
        <div className="clue-box"><span>CLUE 01</span><strong>COMING SOON</strong></div>
        <small>{identity}</small>
      </section>
    </main>
  );
}
