import { Check } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <Check size={16} />
      {message}
    </div>
  );
}
