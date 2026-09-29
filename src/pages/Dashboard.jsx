import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import PageShell from '../components/PageShell.jsx';

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return '🎬';
  if (['mp3', 'wav', 'm4a'].includes(ext)) return '🎵';
  return '📄';
}

function isImageFile(name) {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(name.split('.').pop().toLowerCase());
}

function formatFileSize(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [userId, setUserId] = useState(null);
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user.id;
    setUserId(uid);

    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (!error) {
      setProfile(data);
      if (data.password_set === false) {
        navigate('/set-password');
        return;
      }
    } else {
      setProfile({ email: userData.user.email });
    }
    loadFiles(uid);
    loadNotes();
  }

  async function loadFiles(uid) {
    const { data, error } = await supabase.storage.from('user-files').list(uid, {
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) {
      setUploadStatus(`Could not load files: ${error.message}`);
      return;
    }

    const filesWithUrls = await Promise.all((data || []).map(async (file) => {
      const { data: signedData } = await supabase.storage
        .from('user-files')
        .createSignedUrl(`${uid}/${file.name}`, 3600);
      return { ...file, signedUrl: signedData?.signedUrl || '' };
    }));
    setFiles(filesWithUrls);
  }

  async function uploadOne(file) {
    if (!file || !userId) return;
    setUploading(true);
    setUploadStatus('');
    const path = `${userId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('user-files').upload(path, file);
    setUploading(false);
    if (error) {
      setUploadStatus(`Upload failed: ${error.message}`);
      return;
    }
    setUploadStatus('Upload complete. Your file is ready below.');
    loadFiles(userId);
  }

  async function handleFileInput(e) {
    await uploadOne(e.target.files[0]);
    e.target.value = '';
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }
  async function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    await uploadOne(e.dataTransfer.files[0]);
  }

  async function getFileUrl(fileName) {
    const { data } = await supabase.storage.from('user-files').createSignedUrl(`${userId}/${fileName}`, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function deleteFile(fileName) {
    await supabase.storage.from('user-files').remove([`${userId}/${fileName}`]);
    loadFiles(userId);
  }

  async function loadNotes() {
    const { data, error } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
    if (!error) setNotes(data || []);
  }

  async function addNote(e) {
    e.preventDefault();
    if (!noteText.trim() || !userId) return;
    const { error } = await supabase.from('notes').insert({ user_id: userId, content: noteText.trim() });
    if (!error) {
      setNoteText('');
      loadNotes();
    }
  }

  async function deleteNote(id) {
    await supabase.from('notes').delete().eq('id', id);
    loadNotes();
  }

  async function handleLogout() {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      setLoggingOut(false);
      return;
    }
    navigate('/login');
  }

  const displayName = profile?.email?.split('@')[0] || 'there';
  const initial = (profile?.email || '?').charAt(0).toUpperCase();

  return (
    <PageShell className="dashboard-shell">
      <div className="dashboard-layout" id="top">
        <aside className="dash-sidebar">
          <a className="dash-brand" href="#top">
            <span className="dash-brand-mark" aria-hidden="true">◈</span>
            <span>SecureVault</span>
          </a>
          <nav className="dash-nav" aria-label="Dashboard navigation">
            <a className="dash-nav-link is-active" href="#top"><span aria-hidden="true">⌂</span>Home</a>
            <a className="dash-nav-link" href="#files"><span aria-hidden="true">▧</span>My files</a>
            <a className="dash-nav-link" href="#notes"><span aria-hidden="true">≡</span>Notes</a>
          </nav>
          <div className="dash-sidebar-bottom" id="account">
            <div className="dash-storage-line"><span>{files.length} {files.length === 1 ? 'file' : 'files'}</span><strong>Vault active</strong></div>
            <div className="dash-storage-track"><span /></div>
            <div className="dash-account-line"><span className="dash-account-avatar">{initial}</span><span className="dash-account-email">{profile?.email}</span></div>
          </div>
        </aside>

        <main className="dash-main">
          <div className="dash-main-inner">
            <header className="dash-topbar">
              <div>
                <p className="dash-greeting"><span aria-hidden="true">✦</span> Welcome back, {displayName}!</p>
                <p className="dash-email">{profile?.email}</p>
              </div>
              <div className="dash-header-actions">
                <button className="btn-outline" onClick={handleLogout} disabled={loggingOut}>
                  <span aria-hidden="true">↪</span> {loggingOut ? 'Logging out...' : 'Log out'}
                </button>
              </div>
            </header>

            <section className="upload-section" aria-label="Upload to private cloud">
              <input ref={fileInputRef} type="file" onChange={handleFileInput} hidden />
              <button
                type="button"
                className={`upload-zone ${isDragging ? 'dropzone--active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <span className="upload-cloud" aria-hidden="true">⇧</span>
                <span className="upload-title">{uploading ? 'Uploading your file...' : 'Click to upload to Private Cloud'}</span>
                <span className="upload-subtitle">Photos, documents, and media files</span>
              </button>
              {uploadStatus && <p className={`upload-status ${uploadStatus.startsWith('Upload failed') || uploadStatus.startsWith('Could not') ? 'is-error' : ''}`} role="status">{uploadStatus}</p>}
            </section>

            <section className="files-section" id="files">
              <div className="dash-section-heading">
                <h2>My Vault Files</h2>
                <span>{files.length} {files.length === 1 ? 'file' : 'files'} stored</span>
              </div>
              {files.length === 0 ? (
                <div className="vault-empty">
                  <span aria-hidden="true">▧</span>
                  <p>Your private files will appear here.</p>
                </div>
              ) : (
                <div className="vault-grid">
                  {files.map((file) => (
                    <article key={file.name} className="vault-file-card">
                      <button type="button" className="vault-file-preview" onClick={() => getFileUrl(file.name)} title={`Open ${file.name}`}>
                        {isImageFile(file.name) && file.signedUrl ? (
                          <img src={file.signedUrl} alt={file.name} loading="lazy" />
                        ) : (
                          <span className="vault-file-icon" aria-hidden="true">{fileIcon(file.name)}</span>
                        )}
                        <span className="vault-open-mark" aria-hidden="true">↗</span>
                      </button>
                      <div className="vault-file-details">
                        <div className="vault-file-copy">
                          <p className="vault-file-name" title={file.name}>{file.name}</p>
                          <span>{formatFileSize(file.metadata?.size)}</span>
                        </div>
                        <div className="vault-file-actions">
                          <button type="button" onClick={() => getFileUrl(file.name)} aria-label={`Open ${file.name}`} title="Open file">↗</button>
                          <button type="button" className="delete-action" onClick={() => deleteFile(file.name)} aria-label={`Delete ${file.name}`} title="Delete file">×</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="glass-card notes-card" id="notes">
              <div className="notes-heading">
                <div>
                  <p className="section-kicker">YOUR PRIVATE SPACE</p>
                  <h2>My Notes</h2>
                </div>
                <span className="notes-count">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
              </div>
              <form onSubmit={addNote} className="note-form">
                <input
                  type="text"
                  placeholder="Write a private note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <button type="submit">Add note</button>
              </form>
              <ul className="dash-list">
                {notes.length === 0 && <li className="dash-empty">Your private notes will appear here.</li>}
                {notes.map((note) => (
                  <li key={note.id} className="dash-item">
                    <span className="dash-item-name">{note.content}</span>
                    <button className="link-text danger" onClick={() => deleteNote(note.id)}>delete</button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>
      </div>
    </PageShell>
  );
}
