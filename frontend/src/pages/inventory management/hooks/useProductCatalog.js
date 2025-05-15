import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getInventoryItems } from '../../../services/inventoryService';
import useProductFilters from './useProductFilters';
import useProductMutations from './useProductMutations'

function useProductCatalog() {
  const isManager = true; // Replace with auth context
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProductId, setDeleteProductId] = useState(null);

  const { filters, sort, showFilters, handleFilterChange, handleSortChange, toggleFilters } =
    useProductFilters();
  const { editMutation, deleteMutation, releaseMutation, adjustStockMutation } =
    useProductMutations();

  // Fetch products from server
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', filters, sort],
    queryFn: () => getInventoryItems(),
    select: (data) => {
      let filtered = [...data];
      if (filters.category) {
        filtered = filtered.filter((p) => p.category === filters.category);
      }
      if (filters.stockStatus) {
        filtered = filtered.filter((p) => {
          const stockLevel = p.stockLevel || 0;
          if (filters.stockStatus === 'inStock') return stockLevel > 20;
          if (filters.stockStatus === 'lowStock') return stockLevel > 0 && stockLevel <= 20;
          if (filters.stockStatus === 'outOfStock') return stockLevel === 0;
          return true;
        });
      }
      if (filters.search) {
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      filtered.sort((a, b) => {
        if (sort === 'name-asc') return a.name.localeCompare(b.name);
        if (sort === 'name-desc') return b.name.localeCompare(a.name);
        if (sort === 'price-asc') return (a.unitCost || 0) - (b.unitCost || 0);
        if (sort === 'price-desc') return (b.unitCost || 0) - (a.unitCost || 0);
        if (sort === 'stock-asc') return (a.stockLevel || 0) - (b.stockLevel || 0);
        if (sort === 'stock-desc') return (b.stockLevel || 0) - (a.stockLevel || 0);
        return 0;
      });
      return filtered;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch products', { toastId: 'fetch-products-error' });
    },
  });

  // Handlers
  const handleEditOpen = (product) => {
    setEditProduct(product);
  };

  const handleEditClose = () => {
    setEditProduct(null);
  };

  const handleEditSubmit = (id, data) => {
    editMutation.mutate(id, data);
    setEditProduct(null);
  };

  const handleDeleteOpen = (id) => {
    setDeleteProductId(id);
  };

  const handleDeleteClose = () => {
    setDeleteProductId(null);
  };

  const handleDeleteConfirm = (id) => {
    deleteMutation.mutate(id);
    setDeleteProductId(null);
  };

  const handleReleaseProduct = (id) => {
    releaseMutation.mutate(id);
  };

  const handleAdjustStock = (id, quantity, action) => {
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity', { toastId: 'stock-adjust-error' });
      return;
    }
    adjustStockMutation.mutate({ id, quantity, action });
  };

  return {
    products,
    isLoading,
    filters,
    sort,
    showFilters,
    editProduct,
    deleteProductId,
    isManager,
    handleFilterChange,
    handleSortChange,
    toggleFilters,
    handleEditOpen,
    handleEditClose,
    handleEditSubmit,
    handleDeleteOpen,
    handleDeleteClose,
    handleDeleteConfirm,
    handleReleaseProduct,
    handleAdjustStock,
   
  };
}

export default useProductCatalog;