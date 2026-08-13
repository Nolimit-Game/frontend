"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

type Quest = {
  success: boolean;
  completed?: boolean;
  current_step?: number;
  title?: string;
  clue_text?: string;
  voucher_code?: string;
  error_code?: string;
};

export default function QuestDashboard() {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [message, setMessage] = useState("Starting test session...");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  useEffect(() => {
    let active = true;
    async function startAnonymousSession() {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          setMessage(`${error.message} Enable anonymous sign-ins in Supabase to test.`);
          return;
        }
      }
      if (!active) return;
      const { data, error } = await supabase.rpc("get_current_quest");
      if (error) setMessage(error.message);
      else {
        setQuest(data as Quest);
        setMessage("");
      }
    }
    void startAnonymousSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isScannerOpen) return;
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    void scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      async (decodedText) => {
        await scanner.stop();
        scanner.clear();
        scannerRef.current = null;
        setIsScannerOpen(false);
        const token = new URL(decodedText).searchParams.get("token");
        if (!token) {
          setMessage("That QR code is not a NoLimit checkpoint.");
          return;
        }
        setMessage("Checking checkpoint...");
        const { data, error } = await supabase.rpc("process_qr_scan", { p_qr_secret: token });
        if (error) setMessage(error.message);
        else if (!(data as Quest).success) setMessage(`Scan rejected: ${(data as Quest).error_code}`);
        else {
          const { data: questData, error: questError } = await supabase.rpc("get_current_quest");
          if (questError) setMessage(questError.message);
          else {
            setQuest(questData as Quest);
            setMessage("");
          }
        }
      },
      () => undefined,
    ).catch(() => setMessage("Camera could not start. Check browser camera permissions."));

    return () => {
      if (scannerRef.current?.isScanning) void scannerRef.current.stop().then(() => scanner.clear());
      scannerRef.current = null;
    };
  }, [isScannerOpen]);

  return (
    <main className="dashboard-page">
      <div className="dashboard-brand"><span className="status-dot" /> NoLimit / Test mission</div>
      <section className="dashboard-card">
        <span className="card-kicker">{"// ACTIVE CLUE"}</span>
        {quest?.completed ? <><h1>Quest<br /><em>complete.</em></h1><p>Show this voucher at the counter.</p><div className="voucher-box">{quest.voucher_code}</div></> : <>
          <h1>{quest?.current_step ? `0${quest.current_step}` : "..."}</h1>
          <h2>{quest?.title ?? "Loading clue..."}</h2>
          <p>{quest?.clue_text ?? message}</p>
          <button className="clue-box clue-button" onClick={() => setIsScannerOpen(true)} disabled={!quest?.success}> <span>SCAN CLUE</span><strong>OPEN CAMERA ↗</strong></button>
        </>}
        {message && quest?.success && <small>{message}</small>}
      </section>
      {isScannerOpen && <div className="scanner-modal"><div className="scanner-panel"><button className="scanner-close" onClick={() => setIsScannerOpen(false)}>Close</button><div id="qr-reader" /><p>Point your camera at the checkpoint QR code.</p></div></div>}
    </main>
  );
}
