'use client';

import { useEffect, useState } from 'react';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { setEmail(new URLSearchParams(window.location.search).get('email') || ''); }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault(); setMsg(''); setBusy(true);
    try {
      const r = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(d.error?.message || 'Verification failed.'); return; }
      window.location.href = '/';
    } catch { setMsg('Network error. Please try again.'); } finally { setBusy(false); }
  }

  async function resend() {
    setMsg(''); setBusy(true);
    try {
      const r = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(d.error?.message || 'Could not resend the code.'); return; }
      setSent(true); setMsg('A new code has been sent.');
    } catch { setMsg('Network error. Please try again.'); } finally { setBusy(false); }
  }

  return <main className="auth-page"><header className="auth-nav"><a href="/" className="brand">NUMELIXA</a><a href="/login" className="back-link">← Back to sign in</a></header><section className="auth-layout"><div className="auth-intro"><p className="eyebrow">EMAIL VERIFICATION</p><h1>Check your inbox.</h1><p>Enter the 6-digit code we sent to your email address to activate your Numelixa account.</p></div><div className="authbox"><h2>Verify your email</h2><p className="auth-subtitle">{email || 'Enter your email and the code you received.'}</p><form onSubmit={verify} className="auth-form"><label><span>Email address</span><input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label><span>6-digit code</span><input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" placeholder="000000" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} /></label>{msg && <div className="error"><strong>{sent ? 'Code sent' : 'Verification'}</strong><span>{msg}</span></div>}<button className="btn auth-submit" disabled={busy || code.length !== 6}>{busy ? 'Please wait…' : 'Verify email'}</button></form><button className="forgot" onClick={resend} disabled={busy || !email}>Resend code</button></div></section></main>;
}
