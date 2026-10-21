import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react';

export default function AuthPage({ onAuthenticate }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await onAuthenticate(mode, values);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-story">
        <div className="auth-brand">
          <span className="brand-orbit" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          smartdesk
        </div>
        <div className="auth-story-copy">
          <span className="auth-kicker">
            <Sparkles size={15} /> SUPPORT THAT THINKS WITH YOU
          </span>
          <h1>Make every customer conversation feel easier.</h1>
          <p>Your tickets, orders, and trusted answers—together in one calm workspace.</p>
        </div>
        <div className="auth-visual" aria-hidden="true">
          <div className="auth-orb orb-a" />
          <div className="auth-orb orb-b" />
          <div className="auth-note note-main">
            <span className="note-spark">
              <Sparkles size={17} />
            </span>
            <div>
              <b>A little help, right on time</b>
              <small>Your workspace assistant is ready</small>
            </div>
            <span className="note-check">✓</span>
          </div>
          <div className="auth-note note-small">
            <span className="note-pulse" />
            <div>
              <b>Your work stays yours</b>
              <small>Private account workspace</small>
            </div>
          </div>
        </div>
        <div className="auth-story-foot">
          <span>Thoughtful support starts here</span>
          <span>01 — YOUR WORKSPACE</span>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-mobile-brand">
          <span className="brand-orbit" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          smartdesk
        </div>
        <div className="auth-card-wrap">
          <div className="auth-card-heading">
            <span className="auth-lock">
              <LockKeyhole size={18} />
            </span>
            <p className="auth-eyebrow">{isSignup ? 'YOUR OWN SPACE' : 'WELCOME BACK'}</p>
            <h2>{isSignup ? 'Create your account' : 'Sign in to SmartDesk'}</h2>
            <p className="auth-subtitle">
              {isSignup
                ? 'Start with a clean, private workspace.'
                : 'Pick up right where your team left off.'}
            </p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {isSignup && (
              <label>
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Jamie Lee"
                  minLength="2"
                  maxLength="60"
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@yourshop.com"
                required
              />
            </label>
            <label>
              Password
              <span className="password-field">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'}
                  minLength={isSignup ? 8 : undefined}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : isSignup ? 'Create my workspace' : 'Sign in'}{' '}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : 'New to SmartDesk?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? 'login' : 'signup');
                setError('');
              }}
            >
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          <p className="auth-private">
            <LockKeyhole size={13} /> Your account data stays private to your workspace.
          </p>
        </div>
        <div className="auth-footer">
          SMARTDESK <span>·</span> A BETTER WAY TO SUPPORT
        </div>
      </section>
    </main>
  );
}
