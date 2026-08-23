import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/api";

// ✅ Place Order from Cart
export const placeOrderFromCart = createAsyncThunk(
  "order/placeOrderFromCart",
  async ({ userId, totalPrice, addressId, paymentMethod = 'cod', orderType = 'home_delivery', latitude, longitude, couponCode, couponDiscount, walletAmountUsed }, thunkAPI) => {
    try {
      const orderData = {
        user_id: userId,
        total_price: totalPrice.toString(),
        address_id: addressId,
        payment_method: paymentMethod,
        order_type: orderType
      };
      if (latitude != null && longitude != null) {
        orderData.latitude = latitude;
        orderData.longitude = longitude;
      }
      if (couponCode) {
        orderData.coupon_code = couponCode;
        orderData.coupon_discount = String(couponDiscount || 0);
      }
      if (walletAmountUsed && walletAmountUsed > 0) {
        orderData.wallet_amount_used = walletAmountUsed;
      }
      
      console.log("Placing order with data:", orderData);
      const res = await API.post("/orders/place_order", orderData);
      console.log("Place order response:", res.data);
      return res.data;
    } catch (err) {
      console.error("Place order error:", err.response?.data);
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.response?.data?.error || "Failed to place order"
      );
    }
  }
);

const orderSlice = createSlice({
  name: "order",
  initialState: {
    loading: false,
    error: null,
    orderSuccess: false,
    orderId: null,
    ecomOrderId: null,
  },
  reducers: {
    clearOrderStatus: (state) => {
      state.error = null;
      state.orderSuccess = false;
      state.orderId = null;
      state.ecomOrderId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Place Order from Cart
      .addCase(placeOrderFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.orderSuccess = false;
      })
      .addCase(placeOrderFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.orderSuccess = true;
        state.orderId = action.payload?.order_id || action.payload?.data?.order_id;
        state.ecomOrderId = action.payload?.ecom_order_id || action.payload?.data?.ecom_order_id || null;
        state.error = null;
      })
      .addCase(placeOrderFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.orderSuccess = false;
      });
  },
});

export const { clearOrderStatus } = orderSlice.actions;
export default orderSlice.reducer;