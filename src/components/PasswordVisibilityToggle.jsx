export default function PasswordVisibilityToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      className="toggle-password"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      title={visible ? 'Hide password' : 'Show password'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.6" />
        {!visible && <path d="m4 4 16 16" />}
      </svg>
    </button>
  );
}