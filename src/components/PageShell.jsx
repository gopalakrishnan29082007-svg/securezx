// Shared video-background shell used by EVERY page (login, signup,
// verify-otp, reset-password, dashboard) so the whole app feels consistent.
export default function PageShell({ children, className = '', video = true }) {
  return (
    <div className={`page-shell ${className}`.trim()}>
      {video && (
        <video className="bg-video" autoPlay loop muted playsInline>
          <source src={`${import.meta.env.BASE_URL}bg-video.mp4`} type="video/mp4" />
        </video>
      )}
      <div className="bg-overlay" />
      <div className="page-content">{children}</div>
    </div>
  );
}
