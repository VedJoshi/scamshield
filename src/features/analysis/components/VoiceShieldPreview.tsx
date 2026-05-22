"use client";

import { useEffect, useMemo, useState } from "react";

const SCRIPT =
  "Xin chao, toi goi tu Vietcombank. Tai khoan cua ban dang bi khoa do giao dich bat thuong. De giu tien an toan, ban can doc ma OTP vua gui den dien thoai va chuyen tien sang tai khoan bao ve trong vong nam phut.";

const SIGNALS = [
  { at: 8, label: "Bank impersonation" },
  { at: 16, label: "Account freeze urgency" },
  { at: 27, label: "OTP request" },
  { at: 37, label: "Safe-account transfer" },
];

export function VoiceShieldPreview() {
  const words = useMemo(() => SCRIPT.split(" "), []);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  const displayedText = words.slice(0, wordIndex).join(" ");
  const activeSignals = SIGNALS.filter((signal) => wordIndex >= signal.at);
  const riskScore = Math.round((wordIndex / words.length) * 87);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    if (wordIndex >= words.length) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setWordIndex((current) => Math.min(current + 1, words.length));
    }, 150);

    return () => window.clearTimeout(timer);
  }, [isPlaying, wordIndex, words.length]);

  function play() {
    setIsExpanded(true);
    setWordIndex(0);
    setIsPlaying(true);
  }

  function stop() {
    setIsPlaying(false);
    setWordIndex(0);
  }

  return (
    <div className="voice-preview">
      <div className="voice-preview-topline">
        <span>DEMO SIMULATION</span>
        <span>Audio file analysis: Live</span>
      </div>

      {!isExpanded ? (
        <button className="secondary-button" type="button" onClick={() => setIsExpanded(true)}>
          See live demo -&gt;
        </button>
      ) : (
        <div className="voice-preview-body">
          <div className="call-header">
            <div>
              <strong>Incoming call analysis - live mode</strong>
              <span>Caller ID: +84 90 123 4567</span>
            </div>
            <span className={`call-status ${isPlaying ? "listening" : ""}`}>
              {isPlaying ? "Listening" : "Inactive"}
            </span>
          </div>

          <div className="live-transcript">
            <p>{displayedText || "Transcript will appear here as the simulated call plays."}</p>
            <div className="signal-pill-row">
              {activeSignals.map((signal) => (
                <span className="signal-pill" key={signal.label}>
                  {signal.label}
                </span>
              ))}
            </div>
          </div>

          <div className="risk-meter">
            <div className="risk-meter-label">
              <strong>Risk: {riskScore >= 72 ? "HIGH" : riskScore >= 36 ? "MEDIUM" : "LOW"}</strong>
              <span>{riskScore}/100</span>
            </div>
            <div className="risk-meter-track">
              <div className="risk-meter-fill" style={{ width: `${riskScore}%` }} />
            </div>
          </div>

          <div className="voice-preview-controls">
            <button className="primary-button" type="button" onClick={play}>
              Play demo
            </button>
            <button className="secondary-button" type="button" onClick={stop}>
              Stop
            </button>
          </div>

          <p className="voice-preview-note">
            Live roadmap: WebRTC audio stream to transcription to VoiceShield analysis to instant
            in-call alert. Target: Q3 2026.
          </p>
        </div>
      )}
    </div>
  );
}
