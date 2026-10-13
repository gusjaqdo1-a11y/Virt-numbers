'use client';

import { useState } from 'react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(''); setBusy(true);
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(d.error?.message || 'Admin login failed.'); return; }
      window.location.href = '/admin';
    } catch { setMsg('Network error. Please try again.'); } finally { setBusy(false); }
  }

  return <main className="auth-page"><header className="auth-nav"><a href="/" className="brand">NUMELIXA</a><a href="/" className="back-link">← Main site</a></header><section className="auth-layout"><div className="auth-intro"><p className="eyebrow">PRIVATE ADMIN AREA</p><h1>Control center.</h1><p>Sign in with the administrator credentials configured for this Numelixa deployment.</p></div><div className="authbox"><h2>Admin sign in</h2><p className="auth-subtitle">Only the configured administrator account can enter this area.</p><form onSubmit={submit} className="auth-form"><label><span>Admin email</span><input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></label><label><span>Password</span><input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>{msg && <div className="error"><strong>Unable to sign in</strong><span>{msg}</span></div>}<button className="btn auth-submit" disabled={busy}>{busy ? 'Please wait…' : 'Enter admin'}</button></form></div></section></main>;
}
