"use client";

import { useState, useEffect } from "react";
import { analyzeMessage, riskLevel } from "../lib/scamDetector";

const FREE_DAILY_LIMIT = 3;

export default function Home() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [plan, setPlan] = useState("free"); // "free" | "premium"
  const [usedToday, setUsedToday] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [siteStats, setSiteStats] = useState({ total: 0, risky: 0, today: 0 });

  useEffect(() => {
    const savedPlan = window.localStorage.getItem("scamcheck_plan");
    if (savedPlan === "premium") setPlan("premium");

    const todayStr = new Date().toISOString().slice(0, 10);
    const savedDay = window.localStorage.getItem("scamcheck_day");
    const savedUsed = window.localStorage.getItem("scamcheck_used");
    if (savedDay === todayStr && savedUsed) {
      setUsedToday(parseInt(savedUsed, 10));
    } else {
      window.localStorage.setItem("scamcheck_day", todayStr);
      window.localStorage.setItem("scamcheck_used", "0");
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      window.localStorage.setItem("scamcheck_plan", "premium");
      setPlan("premium");
    }

    fetchSiteStats();
  }, []);

  async function fetchSiteStats() {
    try {
      const res = await fetch("/api/usage");
      const data = await res.json();
      setSiteStats(data);
    } catch (e) {}
  }

  function handleCheck() {
    const analysis = analyzeMessage(message);
    if (!analysis.valid) {
      alert("Please paste a message first.");
      return;
    }

    if (plan !== "premium" && usedToday >= FREE_DAILY_LIMIT) {
      setShowModal(true);
      return;
    }

    const { level, advice, tier } = riskLevel(analysis.score);
    setResult({ ...analysis, level, advice, tier });

    const newUsed = usedToday + 1;
    setUsedToday(newUsed);
    window.localStorage.setItem("scamcheck_used", String(newUsed));

    fetch("/api/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wasRisky: analysis.score > 3 }),
    }).then(fetchSiteStats);
  }

  async function handleUpgradeClick() {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/paystack-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout is not fully configured yet. Add your Paystack keys to .env.local.");
      }
    } catch (e) {
      alert("Could not start checkout. Make sure your Paystack keys are set up.");
    } finally {
      setCheckingOut(false);
    }
  }

  const remaining = Math.max(0, FREE_DAILY_LIMIT - usedToday);

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Is this a scam?</h1>
        <p style={styles.subtitle}>
          Paste any suspicious text, email, or message below and get an instant breakdown.
        </p>

        <div style={styles.planRow}>
          <span style={plan === "premium" ? styles.badgePremium : styles.badgeFree}>
            {plan === "premium" ? "Premium — unlimited checks" : "Free plan — 3 checks/day"}
          </span>
          {plan !== "premium" && (
            <button style={styles.upgradeBtnSmall} onClick={() => setShowModal(true)}>
              Upgrade
            </button>
          )}
        </div>

        <textarea
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Example: Congratulations! You have won a $1000 gift card. Click here within 24 hours to claim before it expires..."
          style={styles.textarea}
        />

        <button style={styles.checkBtn} onClick={handleCheck}>
          Check this message
        </button>

        {plan !== "premium" && (
          <p style={styles.limitNote}>
            {remaining} free check{remaining === 1 ? "" : "s"} remaining today
          </p>
        )}

        {result && (
          <div style={{ ...styles.resultCard, ...tierStyle(result.tier) }}>
            <div style={styles.resultHeader}>
              <span style={styles.resultLevel}>{result.level}</span>
            </div>
            <p style={styles.resultMeta}>
              {result.found.length} warning pattern{result.found.length === 1 ? "" : "s"} detected
            </p>
            {result.found.length > 0 && (
              <ul style={styles.tacticsList}>
                {result.found.map((label, i) => (
                  <li key={i} style={styles.tacticItem}>
                    {label}
                  </li>
                ))}
              </ul>
            )}
            <p style={styles.advice}>{result.advice}</p>
          </div>
        )}

        <div style={styles.statsRow}>
          <Stat label="Checked today" value={siteStats.today} />
          <Stat label="Flagged risky" value={siteStats.risky} />
          <Stat label="All-time checks" value={siteStats.total} />
        </div>

        <p style={styles.disclaimer}>
          This tool gives a quick first read using common scam and manipulation patterns. It is
          not a guarantee. When in doubt, verify directly with the company or person through a
          separately confirmed phone number or official website — never through links or numbers
          in the suspicious message itself.
        </p>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={{ fontWeight: 500, fontSize: 16 }}>Upgrade to unlimited</span>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <p style={styles.modalText}>
              Free plan includes 3 checks per day. Upgrade for unlimited checks, priority
              detection updates, and saved history.
            </p>
            <div style={styles.priceRow}>
              <span style={styles.priceNum}>$4.99</span>
              <span style={styles.pricePeriod}>/ month</span>
            </div>
            <button style={styles.checkoutBtn} onClick={handleUpgradeClick} disabled={checkingOut}>
              {checkingOut ? "Redirecting to checkout..." : "Continue to checkout"}
            </button>
            <p style={styles.poweredBy}>Secure payment powered by Paystack</p>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.statBox}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
    </div>
  );
}

function tierStyle(tier) {
  if (tier === "low") return { background: "#eaf7ee", borderColor: "#bfe6cb" };
  if (tier === "medium") return { background: "#fff8e6", borderColor: "#f3deab" };
  return { background: "#fdeaea", borderColor: "#f3bcbc" };
}

const styles = {
  page: { minHeight: "100vh", display: "flex", justifyContent: "center", padding: "48px 16px" },
  card: { width: "100%", maxWidth: 560, background: "#ffffff", borderRadius: 16, padding: 32, border: "1px solid #e8e8e5" },
  h1: { fontSize: 26, fontWeight: 600, margin: "0 0 8px" },
  subtitle: { fontSize: 14, color: "#666", margin: "0 0 20px" },
  planRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  badgeFree: { fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 8, background: "#f0f0ee", color: "#555" },
  badgePremium: { fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 8, background: "#eaf7ee", color: "#1e7a3e" },
  upgradeBtnSmall: { fontSize: 12, padding: "6px 12px" },
  textarea: { width: "100%", border: "1px solid #d8d8d4", borderRadius: 8, padding: "10px 12px", fontSize: 14, resize: "vertical", marginBottom: 12 },
  checkBtn: { width: "100%", padding: 12, fontSize: 14, fontWeight: 500, background: "#1a1a1a", color: "#fff", border: "none" },
  limitNote: { fontSize: 12, color: "#888", textAlign: "center", margin: "8px 0 0" },
  resultCard: { borderRadius: 12, padding: "16px 20px", marginTop: 20, border: "1px solid" },
  resultHeader: { marginBottom: 6 },
  resultLevel: { fontSize: 18, fontWeight: 600 },
  resultMeta: { fontSize: 13, color: "#666", margin: "0 0 10px" },
  tacticsList: { margin: "0 0 12px", paddingLeft: 18 },
  tacticItem: { fontSize: 13, marginBottom: 4 },
  advice: { fontSize: 14, lineHeight: 1.6, margin: 0 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 24, paddingTop: 20, borderTop: "1px solid #eee" },
  statBox: { background: "#f7f7f5", borderRadius: 10, padding: 14, textAlign: "center" },
  statLabel: { fontSize: 12, color: "#888", margin: "0 0 4px" },
  statValue: { fontSize: 22, fontWeight: 600, margin: 0 },
  disclaimer: { fontSize: 12, color: "#999", lineHeight: 1.5, marginTop: 20 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 },
  modal: { background: "#fff", borderRadius: 16, padding: 24, maxWidth: 380, width: "100%" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  closeBtn: { width: 28, height: 28, borderRadius: "50%", padding: 0 },
  modalText: { fontSize: 13, color: "#666", lineHeight: 1.6, margin: "0 0 16px" },
  priceRow: { display: "flex", alignItems: "baseline", gap: 6, marginBottom: 18 },
  priceNum: { fontSize: 28, fontWeight: 600 },
  pricePeriod: { fontSize: 13, color: "#888" },
  checkoutBtn: { width: "100%", padding: 12, fontSize: 14, fontWeight: 500, background: "#1a1a1a", color: "#fff", border: "none", marginBottom: 8 },
  poweredBy: { fontSize: 11, color: "#aaa", textAlign: "center", margin: 0 },
};
