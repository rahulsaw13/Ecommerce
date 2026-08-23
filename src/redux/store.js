import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import cartReducer from "./slices/cartSlice";
import addressReducer from "./slices/addressSlice";
import orderReducer from "./slices/orderSlice";
import companyReducer from "./slices/companySlice";
import walletReducer from "./slices/walletSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    address: addressReducer,
    order: orderReducer,
    company: companyReducer,
    wallet: walletReducer,
  },
});