import { create } from 'zustand';

const useOrderStore = create((set) => ({
    selectedItems: [],
    selectedAddress: null,
    addItem: (item) => set((state) => ({
        selectedItems: [...state.selectedItems, item],
    })),
    removeItem: (index) => set((state) => ({
        selectedItems: state.selectedItems.filter((_, i) => i !== index),
    })),
    setAddress: (address) => set({ selectedAddress: address }),
    clearOrder: () => set({ selectedItems: [], selectedAddress: null }),
}));

export default useOrderStore;