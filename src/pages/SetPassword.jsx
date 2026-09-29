import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import PageShell from '../components/PageShell.jsx';
import PasswordVisibilityToggle from '../components/PasswordVisibilityToggle.jsx';

function isStrongPassword(pw) {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw);
}

export default function SetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSetPassword(e) {
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
    const { data: userData } = await supabase.auth.getUser();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    await supabase.from('profiles').update({ password_set: true }).eq('id', userData.user.id);
    setLoading(false);
    navigate('/dashboard');
  }

  return (
    <PageShell>
      <div className="auth-card">
        <div className="auth-logo">🔑</div>
        <h2>Set a password</h2>
        <p className="auth-subtitle">
          You signed in with Google. Set a password so you can also log in
          with your email directly next time.
        </p>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSetPassword}>
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
          </div>
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </PageShell>
  );
}