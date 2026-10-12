'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetForm() {
  const q = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = q.get('token');
    if (!token) {
      setMessage('Invalid or missing reset token.');
      return;
    }

    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();
    setMessage(
      data.success
        ? 'Password updated. You can sign in now.'
        : data.error?.message || 'Unable to reset password.',
    );
  }

  return (
    <div className="authbox">
      <a className="brand" href="/">NUMELIXA</a>
      <h1>Choose a new password</h1>
      <form onSubmit={submit}>
        <input
          required
          minLength={8}
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn">Update password</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="auth">
      <Suspense fallback={<div className="authbox"><p>Loading reset form…</p></div>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
