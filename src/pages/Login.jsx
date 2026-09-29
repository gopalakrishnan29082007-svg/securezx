import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import PageShell from '../components/PageShell.jsx';
import PasswordVisibilityToggle from '../components/PasswordVisibilityToggle.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: allowed, error: checkError } = await supabase.rpc(
      'check_login_allowed',
      { p_email: email }
    );

    if (checkError) {
      setError('Could not verify login status. Try again.');
      setLoading(false);
      return;
    }

    if (allowed === false) {
      setError('Too many failed attempts. Try again in 15 minutes.');
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      await supabase.rpc('log_failed_attempt', { p_email: email });
      if (signInError.message.toLowerCase().includes('not confirmed')) {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/dashboard');
  }

  async function handleGoogleLogin() {
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL + 'dashboard' },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <PageShell>
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo" aria-hidden="true">✦</span>
          <span>SECUREVAULT</span>
        </div>
        <p className="auth-eyebrow">SECURE ACCESS</p>
        <h2>Welcome back</h2>
        <p className="auth-subtitle">Sign in to continue to your account.</p>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleLogin}>
          <label className="auth-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="auth-label" htmlFor="login-password">Password</label>
          <div className="password-field">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
          </div>
          <div className="auth-options">
            <span className="auth-secure-note">Private and encrypted</span>
            <Link className="link-text" to="/reset-password">Forgot password?</Link>
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            <span className="auth-submit-label">{loading ? 'Checking your account...' : 'Log In'}</span>
            {loading ? <span className="auth-spinner" aria-hidden="true" /> : <span aria-hidden="true">→</span>}
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <button type="button" className="google-btn" onClick={handleGoogleLogin}>
          <span className="google-g">G</span>
          Continue with Google
        </button>

        <p className="auth-switch">
          Don’t have an account? <Link className="link-text" to="/signup">Create account</Link>
        </p>
      </div>
    </PageShell>
  );
}
