import { AlertTriangle } from 'lucide-react';

function ConfirmationModal({
  isOpen,
  title = 'Are you sure?',
  message = 'Do you want to proceed?',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
  cancelButtonClass = 'bg-slate-200 hover:bg-slate-300 text-slate-800',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle className="h-7 w-7" strokeWidth={2} />
          </div>
          <h2
            id="confirmation-modal-title"
            className="text-xl font-semibold text-slate-900"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
        </div>
        <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${cancelButtonClass}`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
