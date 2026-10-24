import { useEffect, useState } from 'react';
import { Camera, LogOut, Save, Trash2, UserRound, X } from 'lucide-react';
import UserAvatar from './UserAvatar.jsx';

function resizeProfilePicture(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('This image could not be opened.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Choose a valid image file.'));
      image.onload = () => {
        const maxSide = 320;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('This browser could not process the image.'));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.76));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileModal({ open, user, onClose, onSave, onSignOut }) {
  const [profile, setProfile] = useState({
    name: '',
    contactEmail: '',
    phone: '',
    address: '',
    profilePicture: '',
  });
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    if (!open) return;
    setProfile({
      name: user?.name || '',
      contactEmail: user?.contactEmail || '',
      phone: user?.phone || '',
      address: user?.address || '',
      profilePicture: user?.profilePicture || '',
    });
    setConfirmLogout(false);
    setPhotoError('');
  }, [open, user]);

  if (!open) return null;

  const updateField = (event) => {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const selectPicture = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError('Choose an image smaller than 8 MB.');
      return;
    }
    try {
      const profilePicture = await resizeProfilePicture(file);
      setProfile((current) => ({ ...current, profilePicture }));
      setPhotoError('');
    } catch (error) {
      setPhotoError(error.message);
    }
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (await onSave(profile)) onClose();
    } finally {
      setSaving(false);
    }
  };

  if (confirmLogout) {
    return (
      <div className="modal-backdrop profile-confirm-backdrop" onClick={() => setConfirmLogout(false)}>
        <section
          className="profile-confirm-modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          aria-describedby="logout-dialog-description"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="profile-confirm-icon"><LogOut size={19} /></div>
          <h2 id="logout-dialog-title">Log out of SmartDesk?</h2>
          <p id="logout-dialog-description">You’ll need to sign in again to open your workspace.</p>
          <div className="profile-confirm-actions">
            <button className="profile-secondary-button" onClick={() => setConfirmLogout(false)}>
              Stay signed in
            </button>
            <button className="profile-danger-button" onClick={onSignOut}>
              <LogOut size={15} /> Log out
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="new-ticket-modal profile-modal"
        onSubmit={submitProfile}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-dialog-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">ACCOUNT SETTINGS</span>
            <h2 id="profile-dialog-title">Your profile</h2>
            <p>Update the details shown in your SmartDesk workspace.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close profile">
            <X size={18} />
          </button>
        </div>

        <div className="profile-photo-row">
          <UserAvatar user={{ ...user, ...profile }} className="avatar profile-photo-preview" />
          <div className="profile-photo-copy">
            <strong>Profile picture</strong>
            <span>Choose an image; it will be resized before saving.</span>
          </div>
          <label className="profile-photo-upload">
            <Camera size={15} /> Choose photo
            <input type="file" accept="image/*" onChange={selectPicture} aria-label="Choose profile picture" />
          </label>
          {profile.profilePicture && (
            <button
              type="button"
              className="profile-photo-remove"
              onClick={() => setProfile((current) => ({ ...current, profilePicture: '' }))}
              aria-label="Remove profile picture"
              title="Remove profile picture"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
        {photoError && <p className="profile-form-error" role="alert">{photoError}</p>}

        <label>
          Name
          <input name="name" value={profile.name} onChange={updateField} maxLength={60} required />
        </label>
        <label>
          Sign-in email
          <input value={user?.email || ''} readOnly aria-describedby="signin-email-note" />
          <small className="profile-field-note" id="signin-email-note">
            Your sign-in email is managed by your Google or password account.
          </small>
        </label>
        <label>
          Contact email
          <input
            name="contactEmail"
            type="email"
            value={profile.contactEmail}
            onChange={updateField}
            placeholder="you@example.com"
            maxLength={254}
          />
        </label>
        <label>
          Phone number
          <input
            name="phone"
            type="tel"
            value={profile.phone}
            onChange={updateField}
            placeholder="+1 555 123 4567"
            maxLength={32}
          />
        </label>
        <label>
          Address
          <textarea
            name="address"
            value={profile.address}
            onChange={updateField}
            placeholder="Street, city, state, postal code"
            rows="3"
            maxLength={300}
          />
        </label>

        <div className="profile-modal-footer">
          <button type="button" className="profile-logout-link" onClick={() => setConfirmLogout(true)}>
            <LogOut size={15} /> Log out
          </button>
          <button className="primary-button" type="submit" disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
