import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import PageShell from '../components/PageShell.jsx';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + import.meta.env.BASE_URL + 'login',
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage('If that email exists, a reset link has been sent.');
  }

  return (
    <PageShell>
      <div className="auth-card">
        <div className="auth-logo">🔑</div>
        <h2>Reset password</h2>
        <p className="auth-subtitle">We'll email you a reset link</p>
        {error && <p className="error-text">{error}</p>}
        {message && <p className="success-text">{message}</p>}
        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          <Link className="link-text" to="/login">Back to login</Link>
        </p>
      </div>
    </PageShell>
  );
}
