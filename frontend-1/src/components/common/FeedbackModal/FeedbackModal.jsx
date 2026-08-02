import { CheckCircle2, XCircle, Info } from 'lucide-react';
import useFeedbackStore from '../../../stores/feedbackStore';

const VARIANT_STYLES = {
  success: {
    iconWrap: 'bg-emerald-50 text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    Icon: CheckCircle2,
  },
  error: {
    iconWrap: 'bg-red-50 text-red-600',
    button: 'bg-red-600 hover:bg-red-700',
    Icon: XCircle,
  },
  info: {
    iconWrap: 'bg-blue-50 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
    Icon: Info,
  },
};

function FeedbackModal() {
  const {
    isOpen,
    variant,
    title,
    message,
    confirmLabel,
    closeFeedback,
  } = useFeedbackStore();

  if (!isOpen) return null;

  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  const Icon = styles.Icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={closeFeedback}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <div className="px-6 pt-8 pb-6 text-center">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${styles.iconWrap}`}
          >
            <Icon className="h-7 w-7" strokeWidth={2} />
          </div>
          <h2
            id="feedback-modal-title"
            className="text-xl font-semibold text-slate-900"
          >
            {title}
          </h2>
          {message ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
          ) : null}
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={closeFeedback}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${styles.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeedbackModal;
