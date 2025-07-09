import React from 'react';

function ConfirmationModal({
  isOpen,
  title = 'Are you sure?',
  message = 'Do you want to proceed?',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
  cancelButtonClass = 'bg-gray-500 hover:bg-gray-600',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className={`py-2 px-4 rounded-md text-white transition-colors ${cancelButtonClass}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`py-2 px-4 rounded-md text-white transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal; 