import { create } from 'zustand';

const useCartStore = create((set, get) => ({
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    triggerUpdate: false,
    sideCartVisible: false,

    setTrigger: () => set((state) => ({ triggerUpdate: !state.triggerUpdate })),

    setCart: (newCart) => {
        localStorage.setItem('cart', JSON.stringify(newCart));
        set((state) => ({
            cart: newCart,
            triggerUpdate: !state.triggerUpdate // Toggle trigger to notify components
        }));
        
        // Dispatch a custom event to notify all components
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: newCart }));
    },

    setSideCartVisible: (visible) => set({ sideCartVisible: visible }),

    // Check if an item is already in the cart
    isItemInCart: (productId, weight) => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        return cart.some(item => item.id === productId && item.weight === weight);
    },

    // Add item to cart and open sidebar
    addToCartAndOpenSidebar: (product) => {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];

        const existingProductIndex = cart.findIndex(
            (p) => p.id === product.id && p.weight === product.weight
        );

        if (existingProductIndex !== -1) {
            cart[existingProductIndex].quantity += product.quantity;
        } else {
            cart.push(product);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        set({
            cart: cart,
            triggerUpdate: !get().triggerUpdate,
            sideCartVisible: true
        });
        
        // Dispatch a custom event to notify all components
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
    },

    // Get quantity of specific item in cart
    getItemQuantity: (productId, weight) => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const item = cart.find(item => item.id === productId && item.weight === weight);
        return item?.quantity || 0;
    },

    // Update quantity of specific item in cart
    updateItemQuantity: (productId, weight, newQuantity) => {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        if (newQuantity <= 0) {
            // Remove item if quantity is 0 or less
            cart = cart.filter(item => !(item.id === productId && item.weight === weight));
        } else {
            const itemIndex = cart.findIndex(item => item.id === productId && item.weight === weight);
            if (itemIndex !== -1) {
                cart[itemIndex].quantity = newQuantity;
            }
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        set({
            cart: cart,
            triggerUpdate: !get().triggerUpdate
        });
        
        // Dispatch a custom event to notify all components
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
    },

    // Increment item quantity in cart
    incrementItemQuantity: (productId, weight) => {
        const currentQuantity = get().getItemQuantity(productId, weight);
        get().updateItemQuantity(productId, weight, currentQuantity + 1);
    },

    // Decrement item quantity in cart
    decrementItemQuantity: (productId, weight) => {
        const currentQuantity = get().getItemQuantity(productId, weight);
        if (currentQuantity > 1) {
            get().updateItemQuantity(productId, weight, currentQuantity - 1);
        } else {
            // Remove item if quantity becomes 0
            get().updateItemQuantity(productId, weight, 0);
        }
    },

    // Clear cart completely (used after successful checkout)
    clearCart: () => {
        localStorage.removeItem('cart');
        set({
            cart: [],
            triggerUpdate: !get().triggerUpdate,
            sideCartVisible: false
        });
        
        // Dispatch a custom event to notify all components
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
    }
}));

export default useCartStore;