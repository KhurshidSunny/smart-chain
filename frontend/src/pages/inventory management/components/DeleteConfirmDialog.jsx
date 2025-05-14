import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

function DeleteConfirmDialog({ open, productId, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="delete-confirm-dialog-title">
      <DialogTitle id="delete-confirm-dialog-title">Confirm Deletion</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete this product? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} aria-label="Cancel deletion">
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(productId)}
          sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
          aria-label="Confirm deletion"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteConfirmDialog;