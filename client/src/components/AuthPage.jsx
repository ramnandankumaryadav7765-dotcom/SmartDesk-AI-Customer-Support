import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import { firebaseSignInErrorMessage, isFirebaseConfigured } from '../firebase.js';

export default function AuthPage({ onAuthenticate, onGoogleAuthenticate, theme, onToggleTheme }) {
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

  const continueWithGoogle = async () => {
    setBusy(true);
    setError('');
    try {
      await onGoogleAuthenticate();
    } catch (requestError) {
      setError(firebaseSignInErrorMessage(requestError));
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
        <div className="auth-appearance"><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>
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
          <div className="auth-divider"><span>or continue with</span></div>
          {isFirebaseConfigured ? (
            <button
              className="google-button-shell"
              type="button"
              onClick={continueWithGoogle}
              disabled={busy}
            >
              <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.79 7.18l7.73 6C44.39 38.04 46.98 31.91 46.98 24.55Z" />
                <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
              </svg>
              {busy ? 'Connecting to Google…' : isSignup ? 'Sign up with Google' : 'Continue with Google'}
            </button>
          ) : (
            <p className="google-setup-note" role="status">
              Add the Firebase web app settings to client/.env.local to enable Google sign-in.
            </p>
          )}
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
