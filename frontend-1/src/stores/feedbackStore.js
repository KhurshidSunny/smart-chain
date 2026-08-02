import { create } from 'zustand';

const useFeedbackStore = create((set, get) => ({
  isOpen: false,
  variant: 'success', // success | error | info
  title: '',
  message: '',
  confirmLabel: 'OK',
  onClose: null,

  showFeedback: ({
    variant = 'success',
    title,
    message,
    confirmLabel = 'OK',
    onClose = null,
  }) => {
    set({
      isOpen: true,
      variant,
      title,
      message,
      confirmLabel,
      onClose,
    });
  },

  showSuccess: (title, message, options = {}) => {
    get().showFeedback({
      variant: 'success',
      title,
      message,
      confirmLabel: options.confirmLabel || 'Continue',
      onClose: options.onClose || null,
    });
  },

  showError: (title, message, options = {}) => {
    get().showFeedback({
      variant: 'error',
      title,
      message,
      confirmLabel: options.confirmLabel || 'OK',
      onClose: options.onClose || null,
    });
  },

  closeFeedback: () => {
    const { onClose } = get();
    set({
      isOpen: false,
      title: '',
      message: '',
      onClose: null,
    });
    if (typeof onClose === 'function') {
      onClose();
    }
  },
}));

export default useFeedbackStore;
