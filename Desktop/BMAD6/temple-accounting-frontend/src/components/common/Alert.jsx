export default function Alert({ type = 'info', message, onClose }) {
  const variants = {
    success: 'bg-success-50 text-success-800 border-success-200',
    error: 'bg-danger-50 text-danger-800 border-danger-200',
    warning: 'bg-warning-50 text-warning-800 border-warning-200',
    info: 'bg-primary-50 text-primary-800 border-primary-200',
  };

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 ${variants[type]}`}>
      <div className="flex-1">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg font-semibold cursor-pointer"
        >
          ×
        </button>
      )}
    </div>
  );
}
