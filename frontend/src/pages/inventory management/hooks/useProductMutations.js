import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  reserveInventory,
  releaseInventory,
  adjustInventory,
} from '../../../services/inventoryService';

function useProductMutations() {
  const queryClient = useQueryClient();

  const editMutation = useMutation({
    mutationFn: ({ id, ...data }) =>
      id ? updateInventoryItem(id, data) : createInventoryItem(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['products']);
      toast.success(variables.id ? 'Product updated successfully' : 'Product added successfully', {
        toastId: variables.id ? `edit-product-${variables.id}` : 'add-product',
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update product', {
        toastId: 'edit-product-error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product deleted successfully', { toastId: `delete-product-${id}` });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete product', {
        toastId: 'delete-product-error',
      });
    },
  });

  const reserveMutation = useMutation({
    mutationFn: ({ id, quantity }) => reserveInventory({ productId: id, quantity }),
    onSuccess: (_, { id, quantity }) => {
      queryClient.invalidateQueries(['products']);
      toast.success(`Reserved ${quantity} units`, { toastId: `reserve-product-${id}` });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reserve product', {
        toastId: 'reserve-product-error',
      });
    },
  });

  const releaseMutation = useMutation({
    mutationFn: ({ id, quantity }) => releaseInventory({ productId: id, quantity }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product released successfully', { toastId: `release-product-${id}` });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to release product', {
        toastId: 'release-product-error',
      });
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, quantity, action }) =>
      adjustInventory({
        productId: id,
        quantity: action === 'increase' ? quantity : -quantity,
        reason: `${action} stock via dashboard`,
      }),
    onSuccess: (_, { id, quantity, action }) => {
      queryClient.invalidateQueries(['products']);
      toast.success(`Stock ${action}d by ${quantity}`, { toastId: `stock-${action}-${id}` });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to adjust stock', {
        toastId: 'stock-adjust-error',
      });
    },
  });

  return {
    editMutation,
    deleteMutation,
    reserveMutation,
    releaseMutation,
    adjustStockMutation,
  };
}

export default useProductMutations;