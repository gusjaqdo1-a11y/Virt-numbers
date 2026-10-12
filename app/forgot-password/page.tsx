'use client';

import { useState } from 'react';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
    } finally {
      setBusy(false);
      setDone(true);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <header className="auth-nav">
        <a href="/" className="brand">NUMELIXA</a>
        <a href="/login" className="back-link">← Back to sign in</a>
      </header>
      <section className="auth-layout auth-layout-single">
        <div className="authbox authbox-centered">
          <div className="auth-icon">↗</div>
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h2>Reset your password</h2>
          <p className="auth-subtitle">{done ? 'If that email belongs to an account, you will receive instructions shortly.' : 'Enter the email address connected to your Numelixa account.'}</p>
          {!done && <form onSubmit={submit} className="auth-form"><label><span>Email address</span><input type="email" required placeholder="you@example.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label><button className="btn auth-submit" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button></form>}
          {done && <div className="success-box">Check your inbox and follow the secure reset link if an account exists for that address.</div>}
          <a className="forgot" href="/login">Return to sign in</a>
        </div>
      </section>
    </main>
  );
}
