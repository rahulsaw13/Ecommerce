// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import API from "../../services/api";

// // ✅ ADD TO CART
// export const addToCart = createAsyncThunk(
//   "cart/addToCart",
//   async (data, thunkAPI) => {
//     try {
//       const res = await API.post("/cart/add", data);
//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data || "Error");
//     }
//   }
// );

// // ✅ GET CART
// export const getCart = createAsyncThunk(
//   "cart/getCart",
//   async (userId, thunkAPI) => {
//     try {
//       const res = await API.get(`/cart?userId=${userId}`);
//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data);
//     }
//   }
// );

// // ✅ REMOVE FROM CART
// export const removeFromCart = createAsyncThunk(
//   "cart/removeFromCart",
//   async (data, thunkAPI) => {
//     try {
//       const res = await API.post("/cart/remove", data);
//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data || "Error");
//     }
//   }
// );

// const cartSlice = createSlice({
//   name: "cart",
//   initialState: {
//     items: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     clearCart: (state) => {
//       state.items = [];
//       state.error = null;
//     },
//     updateCartItemCount: (state, action) => {
//       // Optional: update specific item quantity
//     },
//   },

//   extraReducers: (builder) => {
//     builder
//       // ✅ ADD TO CART
//       .addCase(addToCart.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(addToCart.fulfilled, (state, action) => {
//         state.loading = false;
//         // Update cart items after adding
//         if (action.payload?.data) {
//           state.items = action.payload.data;
//         }
//       })
//       .addCase(addToCart.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // ✅ GET CART
//       .addCase(getCart.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(getCart.fulfilled, (state, action) => {
//         state.loading = false;
//         // Handle different response structures
//         const cartData = action.payload?.data?.items || action.payload?.items || action.payload || [];
//         state.items = cartData;
//       })
//       .addCase(getCart.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
      
//       // ✅ REMOVE FROM CART
//       .addCase(removeFromCart.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(removeFromCart.fulfilled, (state, action) => {
//         state.loading = false;
//         if (action.payload?.data) {
//           state.items = action.payload.data;
//         }
//       })
//       .addCase(removeFromCart.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const { clearCart, updateCartItemCount } = cartSlice.actions;
// export default cartSlice.reducer;



import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/api";

// ✅ GET CART - Requires userId as query parameter
export const getCart = createAsyncThunk(
  "cart/getCart",
  async (_, thunkAPI) => {
    try {
      // Get userId from localStorage
      let userId = null;
      try {
        const userDetails = localStorage.getItem("userDetails");
        if (userDetails) {
          const parsedUser = JSON.parse(userDetails);
          userId = parsedUser?.id || parsedUser?.user?.id;
        }
      } catch (e) {
        console.error("Error getting user details:", e);
      }
      
      // Also check Redux state
      const state = thunkAPI.getState();
      const authUser = state.auth?.user;
      userId = userId || authUser?.id || authUser?.user?.id;
      
      if (!userId) {
        console.warn("No userId found, cannot fetch cart");
        return { data: { items: [] } };
      }
      
      console.log("Fetching cart for userId:", userId);
      const res = await API.get(`/cart?userId=${userId}`);
      console.log("Get cart response:", res.data);
      return res.data;
    } catch (err) {
      console.error("Get cart error:", err.response?.data);
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch cart");
    }
  }
);

// ✅ ADD TO CART - Requires userId
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ user_id, product_variant_id, quantity, selected_weight }, thunkAPI) => {
    try {
      if (!user_id) {
        return thunkAPI.rejectWithValue("User not found");
      }

      if (!product_variant_id) {
        return thunkAPI.rejectWithValue("Product variant not found");
      }

      const payload = {
        user_id,
        product_variant_id,
        quantity: quantity || 1,
        ...(selected_weight ? { selected_weight } : {}),
      };

      console.log("✅ FINAL PAYLOAD:", payload);

      const res = await API.post("/cart/add", payload);

      return res.data;

    } catch (err) {
      console.error("❌ Add to cart error:", err.response?.data);
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to add to cart"
      );
    }
  }
);

// ✅ REMOVE FROM CART - Updated version
export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async ({ cartItemId }, thunkAPI) => {
    try {
      // Get userId from localStorage
      let userId = null;
      try {
        const userDetails = localStorage.getItem("userDetails");
        if (userDetails) {
          const parsedUser = JSON.parse(userDetails);
          userId = parsedUser?.id || parsedUser?.user?.id;
        }
      } catch (e) {
        console.error("Error getting user details:", e);
      }
      
      if (!userId) {
        return thunkAPI.rejectWithValue("User not found");
      }
      
      // Try POST method instead of DELETE (some backends don't support DELETE)
      const res = await API.post("/cart/remove", { 
        user_id: userId, 
        cart_item_id: cartItemId 
      });
      
      console.log("Remove from cart response:", res.data);
      return res.data;
    } catch (err) {
      console.error("Remove from cart error:", err.response?.data);
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to remove from cart");
    }
  }
);

// ✅ UPDATE QUANTITY
export const updateCartQuantity = createAsyncThunk(
  "cart/updateCartQuantity",
  async ({ cartItemId, productId, weight, quantity }, thunkAPI) => {
    try {
      // Get userId from localStorage
      let userId = null;
      try {
        const userDetails = localStorage.getItem("userDetails");
        if (userDetails) {
          const parsedUser = JSON.parse(userDetails);
          userId = parsedUser?.id || parsedUser?.user?.id;
        }
      } catch (e) {
        console.error("Error getting user details:", e);
      }

      if (!userId) {
        return thunkAPI.rejectWithValue("User not found");
      }

      const res = await API.put("/cart/update_quantity", {
        cart_item_id: cartItemId,
        user_id: userId,
        product_id: productId,
        weight: weight,
        quantity: quantity
      });
      console.log("Update quantity response:", res.data);
      return res.data;
    } catch (err) {
      console.error("Update quantity error:", err.response?.data);
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to update quantity");
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    loading: false,
    error: null,
    totalItems: 0,
    totalPrice: 0
  },
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      state.error = null;
      state.loading = false;
    },
    updateCartItemCount: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => item.product_id === productId);
      if (item) {
        item.quantity = quantity;
        // Recalculate totals
        state.totalItems = state.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
        state.totalPrice = state.items.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // GET CART
      .addCase(getCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.loading = false;
        // Handle different response structures
        const cartData = action.payload?.data?.items || action.payload?.items || action.payload?.data || [];
        state.items = Array.isArray(cartData) ? cartData : [];
        state.totalItems = state.items.length;
        state.totalPrice = state.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        state.error = null;
        console.log("Cart updated:", { items: state.items.length, total: state.totalPrice });
      })
      .addCase(getCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("Get cart rejected:", action.payload);
      })
      
      // ADD TO CART
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
     .addCase(addToCart.fulfilled, (state, action) => {
  state.loading = false;
  state.error = null;

  console.log("✅ Item added, now refetch cart");
})
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("Add to cart rejected:", action.payload);
      })
      
      // REMOVE FROM CART
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns {message} only — remove item locally by ID
        const { cartItemId } = action.meta.arg;
        state.items = state.items.filter(i => i.cart_item_id !== cartItemId);
        state.totalItems = state.items.length;
        state.totalPrice = state.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        state.error = null;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE QUANTITY
      .addCase(updateCartQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns {message, cart_item_id, quantity} — update item in-place
        const cartItemId = action.payload?.cart_item_id;
        const newQty = action.payload?.quantity;
        if (cartItemId && newQty != null) {
          const item = state.items.find(i => i.cart_item_id === cartItemId);
          if (item) item.quantity = newQty;
        }
        state.totalItems = state.items.length;
        state.totalPrice = state.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        state.error = null;
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCart, updateCartItemCount } = cartSlice.actions;
export default cartSlice.reducer;