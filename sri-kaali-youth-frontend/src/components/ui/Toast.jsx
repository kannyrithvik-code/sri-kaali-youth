import { CheckCircle, AlertCircle, X } from 'lucide-react';

export const Toast = ({ toasts = [], onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <div style={{ flex: 1 }}>{t.message}</div>
          <button
            onClick={() => onRemove(t.id)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
