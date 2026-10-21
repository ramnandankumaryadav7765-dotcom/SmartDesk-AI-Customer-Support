import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

let googleIdentityPromise;
let initializedGoogleClientId = '';
let activeGoogleCredentialHandler = null;

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googleIdentityPromise) return googleIdentityPromise;
  googleIdentityPromise = new Promise((resolve, reject) => {
    let script = document.getElementById('google-identity-services');
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve(window.google), { once: true });
    script.addEventListener('error', () => reject(new Error('Google sign-in could not load. Check your internet connection and try again.')), { once: true });
  }).catch((loadError) => {
    googleIdentityPromise = null;
    throw loadError;
  });
  return googleIdentityPromise;
}

export default function AuthPage({ onAuthenticate, onGoogleAuthenticate, theme, onToggleTheme }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef(null);
  const googleHandlerRef = useRef(onGoogleAuthenticate);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const isSignup = mode === 'signup';

  useEffect(() => {
    googleHandlerRef.current = onGoogleAuthenticate;
  }, [onGoogleAuthenticate]);

  useEffect(() => {
    if (!googleClientId) return undefined;
    let mounted = true;
    loadGoogleIdentity()
      .then((google) => {
        if (!mounted) return;
        activeGoogleCredentialHandler = async (response) => {
          if (!response.credential) {
            setError('Google did not return a sign-in credential. Please try again.');
            return;
          }
          setBusy(true);
          setError('');
          try {
            await googleHandlerRef.current(response.credential);
          } catch (requestError) {
            setError(requestError.message);
          } finally {
            setBusy(false);
          }
        };
        if (initializedGoogleClientId !== googleClientId) {
          google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => activeGoogleCredentialHandler?.(response),
          });
          initializedGoogleClientId = googleClientId;
        }
        setGoogleReady(true);
      })
      .catch((loadError) => {
        if (mounted) setError(loadError.message);
      });
    return () => {
      mounted = false;
      activeGoogleCredentialHandler = null;
    };
  }, [googleClientId]);

  useEffect(() => {
    const google = window.google;
    const element = googleButtonRef.current;
    if (!googleReady || !google?.accounts?.id || !element) return;
    element.replaceChildren();
    google.accounts.id.renderButton(element, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: isSignup ? 'signup_with' : 'signin_with',
      logo_alignment: 'left',
      width: Math.min(420, Math.floor(element.clientWidth || 420)),
    });
  }, [googleReady, isSignup]);

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
          {googleClientId ? (
            <div
              className={`google-button-shell ${busy ? 'is-busy' : ''}`}
              ref={googleButtonRef}
              aria-label={isSignup ? 'Sign up with Google' : 'Sign in with Google'}
            >
              {!googleReady && <span className="google-button-loading">Loading Google sign-in…</span>}
            </div>
          ) : (
            <p className="google-setup-note" role="status">
              Google sign-in will appear after its client ID is configured.
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
