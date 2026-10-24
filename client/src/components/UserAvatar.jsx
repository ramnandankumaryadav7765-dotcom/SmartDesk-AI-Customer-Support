const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export default function UserAvatar({ user, className = 'avatar' }) {
  return (
    <span className={`user-avatar ${className}`} aria-hidden="true">
      {user?.profilePicture ? <img src={user.profilePicture} alt="" /> : initials(user?.name)}
    </span>
  );
}
