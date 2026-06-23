"use client";
import { useState, useEffect } from "react";
import { analyzeMessage, riskLevel } from "@/lib/scamDetector";

const FREE_LIMIT = 3;

export default function Home() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [plan, setPlan] = useState("free");
  const [usedToday, setUsedToday] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedPlan = localStorage.getItem("verifyd_plan");
    if (savedPlan === "premium") setPlan("premium");
    const today = new Date().toISOString().slice(0, 10);
    const savedDay = localStorage.getItem("verifyd_day");
    const savedUsed = localStorage.getItem("verifyd_used");
    if (savedDay === today && savedUsed) {
      setUsedToday(parseInt(savedUsed, 10));
    } else {
      localStorage.setItem("verifyd_day", today);
      localStorage.setItem("verifyd_used", "0");
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      localStorage.setItem("verifyd_plan", "premium");
      setPlan("premium");
    }
  }, []);

  function handleCheck() {
    const analysis = analyzeMessage(message);
    if (!analysis.valid) { alert("Please paste a message first."); return; }
    if (plan !== "premium" && usedToday >= FREE_LIMIT) { setShowModal(true); return; }
    const { level, advice, tier } = riskLevel(analysis.score);
    setResult({ ...analysis, level, advice, tier });
    const newUsed = usedToday + 1;
    setUsedToday(newUsed);
    localStorage.setItem("verifyd_used", String(newUsed));
  }

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/paystack-init", { method: "POST" });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert("Payment not configured yet. Add your Paystack keys to environment variables."); }
    } catch (e) {
      alert("Could not start checkout. Please try again.");
    } finally { setLoading(false); }
  }

  const remaining = Math.max(0, FREE_LIMIT - usedToday);
  const tierColors = {
    low: { bg: "#eaf7ee", border: "#bfe6cb", text: "#1e7a3e" },
    medium: { bg: "#fff8e6", border: "#f3deab", text: "#92610a" },
    high: { bg: "#fdeaea", border: "#f3bcbc", text: "#c0392b" },
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", justifyContent: "center", padding: "48px 16px", background: "#f7f7f5" }}>
      <div style={{ width: "100%", maxWidth: 560, background: "#fff", borderRadius: 16, padding: 32, border: "1px solid #e8e8e5" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 6px" }}>Is this a scam?</h1>
        <p style={{ fontSize: 14, color: "#666", margin: "0 0 20px" }}>Paste any suspicious message and get an instant breakdown.</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 8, background: plan === "premium" ? "#eaf7ee" : "#f0f0ee", color: plan === "premium" ? "#1e7a3e" : "#555" }}>
            {plan === "premium" ? "Premium — unlimited checks" : "Free — 3 checks/day"}
          </span>
          {plan !== "premium" && (
            <button onClick={() => setShowModal(true)} style={{ fontSize: 12, padding: "6px 12px", border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}>Upgrade</button>
          )}
        </div>
        <textarea rows={6} value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Example: Congratulations! You have won a $1000 gift card. Click here within 24 hours to claim..."
          style={{ width: "100%", border: "1px solid #d8d8d4", borderRadius: 8, padding: "10px 12px", fontSize: 14, resize: "vertical", marginBottom: 12, fontFamily: "inherit" }} />
        <button onClick={handleCheck} style={{ width: "100%", padding: 12, fontSize: 14, fontWeight: 500, background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
          Check this message
        </button>
        {plan !== "premium" && (
          <p style={{ fontSize: 12, color: "#888", textAlign: "center", margin: "8px 0 0" }}>
            {remaining} free check{remaining === 1 ? "" : "s"} remaining today
          </p>
        )}
        {result && (
          <div style={{ marginTop: 20, borderRadius: 12, padding: "16px 20px", border: `1px solid ${tierColors[result.tier].border}`, background: tierColors[result.tier].bg }}>
            <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px", color: tierColors[result.tier].text }}>{result.level}</p>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 10px" }}>{result.found.length} warning pattern{result.found.length === 1 ? "" : "s"} detected</p>
            {result.found.length > 0 && (
              <ul style={{ margin: "0 0 12px", paddingLeft: 18 }}>
                {result.found.map((label, i) => <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>{label}</li>)}
              </ul>
            )}
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{result.advice}</p>
          </div>
        )}
        <p style={{ fontSize: 12, color: "#999", lineHeight: 1.5, marginTop: 24 }}>
          This tool gives a quick first read using common scam patterns. It is not a guarantee. When in doubt, verify directly through a separately confirmed contact.
        </p>
      </div>
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 380, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontWeight: 500, fontSize: 16 }}>Upgrade to unlimited</span>
              <button onClick={() => setShowModal(false)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: "0 0 16px" }}>Free plan includes 3 checks per day. Upgrade for unlimited checks.</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 18 }}>
              <span style={{ fontSize: 28, fontWeight: 600 }}>₦2,000</span>
              <span style={{ fontSize: 13, color: "#888" }}>/ month</span>
            </div>
            <button onClick={handleUpgrade} disabled={loading} style={{ width: "100%", padding: 12, fontSize: 14, fontWeight: 500, background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", marginBottom: 8 }}>
              {loading ? "Redirecting..." : "Continue to checkout"}
            </button>
            <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: 0 }}>Secure payment powered by Paystack</p>
          </div>
        </div>
      )}
    </main>
  );
}
