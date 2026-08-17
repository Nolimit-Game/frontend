"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { createClient } from "../../lib/supabase/client";
import LogoutButton from "../logout-button";

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
  const [message, setMessage] = useState("Loading your mission...");
  const [copied, setCopied] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  useEffect(() => {
    let active = true;
    async function loadQuest() {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setMessage("Please sign in to access the mission.");
        return;
      }
      if (!active) return;
      const { data, error } = await supabase.rpc("get_current_quest");
      if (error) setMessage(error.message);
      else {
        const result = data as Quest;
        setQuest(result);
        setMessage(result.success ? "" : result.error_code ?? "Unable to load your mission.");
      }
    }
    void loadQuest();
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

  async function copyVoucher() {
    if (!quest?.voucher_code) return;
    await navigator.clipboard.writeText(quest.voucher_code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="dashboard-page">
    <div className="dashboard-brand"><span><span className="status-dot" /> NoLimit / Live mission</span><LogoutButton /></div>
      <section className="dashboard-card">
        <span className="card-kicker">{"// ACTIVE CLUE"}</span>
        {quest?.completed ? <>
          <span className="completion-mark" aria-hidden="true">✓</span>
          <h1>Quest<br /><em>complete.</em></h1>
          <p className="completion-copy">You made it to the finish line. Show this voucher at the counter to claim your reward.</p>
          <div className="voucher-card" aria-label="Your NoLimit voucher">
            <div className="voucher-card-top">
              <span className="voucher-label">NOLIMIT REWARD</span>
              <span className="voucher-status">VALID</span>
            </div>
            <div className="voucher-perforation" aria-hidden="true" />
            <div className="voucher-code-label">YOUR VOUCHER CODE</div>
            <div className="voucher-code">{quest.voucher_code ?? "UNAVAILABLE"}</div>
            <button className="copy-voucher" type="button" onClick={() => void copyVoucher()} disabled={!quest.voucher_code}>
              <span>{copied ? "COPIED TO CLIPBOARD" : "COPY CODE"}</span><strong>{copied ? "✓" : "↗"}</strong>
            </button>
            <div className="voucher-card-bottom"><span>ONE REWARD PER PLAYER</span><span>NO LIMIT / 2026</span></div>
          </div>
          <p className="voucher-note">Keep this code ready on your phone. The cashier will verify it before applying your reward.</p>
        </> : <>
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
