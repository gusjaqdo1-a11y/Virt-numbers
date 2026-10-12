import { db } from '@/lib/db';
import { readSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export default async function Home() {
  const c = await cookies();
  const uid = await readSession(c.get('numelixa_session')?.value);
  const user = uid
    ? await db.user.findUnique({
        where: { id: uid },
        include: {
          orders: {
            include: { service: { include: { country: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      })
    : null;

  const balance = user ? Number(user.balance).toFixed(2) : null;
  const activeNumbers = user?.orders.filter((o) => o.status === 'ACTIVE').length ?? 0;

  return (
    <main className="shell">
      <nav className="topbar">
        <a className="brand" href="/">NUMELIXA</a>
        <div className="navlinks">
          <a href="/numbers">Numbers</a>
          <a href="/orders">My numbers</a>
          <a href="/developer">Developer API</a>
          <a href="/faq">FAQ</a>
        </div>
        {user ? (
          <a className="balance" href="/payments">${balance}</a>
        ) : (
          <div className="nav-auth">
            <a href="/login">Sign in</a>
            <a className="nav-signup" href="/login?mode=signup">Create account</a>
          </div>
        )}
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">PRIVATE · FAST · SIMPLE</p>
          <h1>Virtual numbers,<br /><span>without the friction.</span></h1>
          <p className="hero-lead">
            Buy a temporary number, receive SMS codes in real time, and manage everything from one calm workspace.
          </p>
          <div className="actions">
            <a className="btn btn-lg" href={user ? '/numbers' : '/login?mode=signup'}>
              {user ? 'Buy a number' : 'Create free account'}
            </a>
            <a className="ghost btn-lg" href={user ? '/numbers' : '/login'}>
              {user ? 'Browse numbers' : 'Sign in'}
            </a>
          </div>
          <div className="trust-row">
            <span><i>✓</i> No setup fee</span>
            <span><i>✓</i> Real-time SMS</span>
            <span><i>✓</i> Simple wallet</span>
          </div>
        </div>

        <div className="card heroCard">
          <div className="card-topline">
            <small>{user ? 'YOUR BALANCE' : 'YOUR NUMELIXA WALLET'}</small>
            <span className="status-dot">{user ? 'READY' : 'PRIVATE'}</span>
          </div>
          {user ? (
            <>
              <strong>${balance}</strong>
              <span>Available instantly</span>
              <div className="line" />
              <small>ACTIVE NUMBERS</small>
              <b className="metric">{activeNumbers}</b>
              <a className="card-link" href="/payments">Add balance →</a>
            </>
          ) : (
            <>
              <strong className="card-word">Your wallet</strong>
              <span>Sign in to see your balance and active numbers.</span>
              <div className="line" />
              <div className="card-actions">
                <a className="btn" href="/login">Sign in</a>
                <a className="ghost" href="/login?mode=signup">Create account</a>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="feature-strip">
        <div><b>01</b><span><strong>Choose</strong> a country & service</span></div>
        <div><b>02</b><span><strong>Fund</strong> your wallet securely</span></div>
        <div><b>03</b><span><strong>Receive</strong> your SMS in real time</span></div>
      </section>

      {user ? (
        <section className="grid">
          <div className="panel">
            <div className="panel-heading"><div><small>WORKFLOW</small><h3>How it works</h3></div></div>
            <div className="steps">
              <span><b>01</b>Choose a country & service</span>
              <span><b>02</b>Pay from your balance</span>
              <span><b>03</b>Copy the number & wait for SMS</span>
            </div>
          </div>
          <div className="panel">
            <div className="panel-heading"><div><small>ACCOUNT</small><h3>Recent activity</h3></div><a href="/orders">View all →</a></div>
            {user.orders.length ? (
              <div>{user.orders.map((o) => <div className="row" key={o.id}><span>+{o.phoneNumber || 'pending'}<small>{o.service.name} · {o.service.country.name}</small></span><strong>${Number(o.price).toFixed(2)}</strong></div>)}</div>
            ) : <p className="muted">Your purchased numbers will appear here.</p>}
          </div>
        </section>
      ) : (
        <section className="guest-section">
          <div>
            <small>READY WHEN YOU ARE</small>
            <h2>A quieter way to handle verification.</h2>
            <p>Create an account to access numbers, wallet payments, SMS history and the developer API.</p>
          </div>
          <a className="btn" href="/login?mode=signup">Get started →</a>
        </section>
      )}

      <footer>
        <span>© Numelixa</span><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/rules">Rules</a><a href="/faq">FAQ</a>
      </footer>
    </main>
  );
}
