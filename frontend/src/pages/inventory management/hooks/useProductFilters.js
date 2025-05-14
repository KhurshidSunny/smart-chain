import { useState } from 'react';

function useProductFilters() {
  const [filters, setFilters] = useState({
    category: '',
    stockStatus: '',
    search: '',
  });
  const [sort, setSort] = useState('name-asc');
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  return {
    filters,
    sort,
    showFilters,
    handleFilterChange,
    handleSortChange,
    toggleFilters,
  };
}

export default useProductFilters;