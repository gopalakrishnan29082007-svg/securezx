import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import PageShell from '../components/PageShell.jsx';

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // 'signup' type because this code came from the sign-up confirmation
    // email (see README for the Supabase email template change needed
    // to send a 6-digit code instead of a link).
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });

    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').update({ password_set: true }).eq('id', data.user.id);
    }

    navigate('/dashboard');
  }

  async function handleResend() {
    setError('');
    setMessage('');
    setResending(true);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setMessage('A new code has been sent to your email.');
  }

  return (
    <PageShell>
      <div className="auth-card">
        <div className="auth-logo">✉️</div>
        <h2>Verify your email</h2>
        <p className="auth-subtitle">Enter the 6-digit code we sent you</p>
        {error && <p className="error-text">{error}</p>}
        {message && <p className="success-text">{message}</p>}
        <form onSubmit={handleVerify}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="8-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={8}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          Didn't get a code?{' '}
          <span className="link-text" onClick={handleResend}>
            {resending ? 'Sending...' : 'Resend code'}
          </span>
        </p>
      </div>
    </PageShell>
  );
}
