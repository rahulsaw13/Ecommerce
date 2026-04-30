import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import cartReducer from "./slices/cartSlice";
import addressReducer from "./slices/addressSlice";
import orderReducer from "./slices/orderSlice";  // Add this


export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
     address: addressReducer,
      order: orderReducer,
  },
});