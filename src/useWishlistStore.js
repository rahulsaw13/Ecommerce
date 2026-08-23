import { create } from 'zustand';

const useWishlistStore = create((set, get) => ({
    items: JSON.parse(localStorage.getItem('wishlist')) || [],

    isWishlisted: (productId, weight) => {
        const items = JSON.parse(localStorage.getItem('wishlist')) || [];
        return items.some(item =>
            item.id === productId && item.weight === weight
        );
    },

    toggleWishlist: (product) => {
        let items = JSON.parse(localStorage.getItem('wishlist')) || [];
        const idx = items.findIndex(
            item => item.id === product.id && item.weight === product.weight
        );

        if (idx !== -1) {
            items.splice(idx, 1);
        } else {
            items.push(product);
        }

        localStorage.setItem('wishlist', JSON.stringify(items));
        set({ items });
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: items }));
        return idx === -1; // true = added, false = removed
    },

    removeFromWishlist: (productId, weight) => {
        let items = JSON.parse(localStorage.getItem('wishlist')) || [];
        items = items.filter(item => !(item.id === productId && item.weight === weight));
        localStorage.setItem('wishlist', JSON.stringify(items));
        set({ items });
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: items }));
    },

    clearWishlist: () => {
        localStorage.removeItem('wishlist');
        set({ items: [] });
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: [] }));
    },
}));

export default useWishlistStore;
