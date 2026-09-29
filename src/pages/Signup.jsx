import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import PageShell from '../components/PageShell.jsx';
import PasswordVisibilityToggle from '../components/PasswordVisibilityToggle.jsx';

function isStrongPassword(pw) {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);
}

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();
    setError('');

    if (!isStrongPassword(password)) {
      setError('Password needs 8+ chars, uppercase, lowercase, and a number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    // No emailRedirectTo here on purpose - we want Supabase to send the
    // OTP-style confirmation email (a 6-digit code), not a magic link.
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
  }

  async function handleGoogleSignup() {
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
        <p className="auth-eyebrow">YOUR PRIVATE SPACE</p>
        <h2>Create your account</h2>
        <p className="auth-subtitle">Start protecting your data.</p>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSignup}>
          <label className="auth-label" htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="auth-label" htmlFor="signup-password">Password</label>
          <div className="password-field">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
          </div>
          <label className="auth-label" htmlFor="signup-confirm-password">Confirm password</label>
          <div className="password-field">
            <input
              id="signup-confirm-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password again"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Sign Up'}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <button type="button" className="google-btn" onClick={handleGoogleSignup}>
          <span className="google-g">G</span>
          Continue with Google
        </button>

        <p className="auth-switch">
          Already have an account? <Link className="link-text" to="/login">Log in</Link>
        </p>
      </div>
    </PageShell>
  );
}
