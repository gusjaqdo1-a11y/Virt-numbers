'use client';

import { useEffect, useState } from 'react';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') setMode('signup');
    if (params.get('error') === 'suspended') setMsg('This account is suspended.');
    if (params.get('error') === 'google_failed') setMsg('Google sign-in could not be completed. Check the Google OAuth configuration in Vercel.');
    if (params.get('error') === 'google_config') setMsg('Google sign-in is not configured on this deployment.');
    if (params.get('error') === 'google_denied') setMsg('Google sign-in was cancelled.');
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try {
      const r = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d.error?.code === 'EMAIL_NOT_VERIFIED') { window.location.href = `/verify-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}`; return; }
        setMsg(d.error?.message || 'Something went wrong. Please try again.');
        return;
      }
      if (d.requiresVerification) { window.location.href = `/verify-email?email=${encodeURIComponent(d.email || form.email.trim().toLowerCase())}`; return; }
      window.location.href = '/';
    } catch {
      setMsg('Network error. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" /><div className="auth-glow auth-glow-two" />
      <header className="auth-nav"><a href="/" className="brand">NUMELIXA</a><a href="/" className="back-link">← Back to home</a></header>
      <section className="auth-layout">
        <div className="auth-intro"><p className="eyebrow">YOUR PRIVATE WORKSPACE</p><h1>{mode === 'login' ? 'Welcome back.' : 'Start with Numelixa.'}</h1><p>{mode === 'login' ? 'Sign in to manage your numbers, wallet and SMS activity.' : 'Create your account and get access to virtual numbers in minutes.'}</p><div className="auth-points"><span><i>✓</i> Fast SMS delivery</span><span><i>✓</i> Simple wallet payments</span><span><i>✓</i> Developer API access</span></div></div>
        <div className="authbox">
          <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMsg(''); }}>Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMsg(''); }}>Create account</button></div>
          <h2>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Use your email and password to continue.' : 'It only takes a minute to get started.'}</p>
          <a className="google-btn" href="/api/auth/google"><span className="google-mark">G</span><span>Continue with Google</span></a><div className="divider"><span>or continue with email</span></div>
          <form onSubmit={submit} className="auth-form">
            {mode === 'signup' && <label><span>Full name</span><input placeholder="Your name" autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>}
            <label><span>Email address</span><input required type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
            <label><span>Password</span><input required minLength={8} type="password" placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
            {msg && <div className="error"><strong>Unable to continue</strong><span>{msg}</span></div>}
            <button className="btn auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>
          {mode === 'login' && <a className="forgot" href="/forgot-password">Forgot your password?</a>}
          <p className="auth-switch">{mode === 'login' ? 'New to Numelixa?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
        </div>
      </section>
    </main>
  );
}
