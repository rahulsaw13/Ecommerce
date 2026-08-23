import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/api";

export const fetchWalletSettings = createAsyncThunk(
  "wallet/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get("/wallet/settings");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const fetchWalletBalance = createAsyncThunk(
  "wallet/fetchBalance",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await API.get(`/wallet/balance?user_id=${userId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState: {
    enabled: false,
    balance: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearWallet: (state) => {
      state.balance = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletSettings.fulfilled, (state, action) => {
        state.enabled = action.payload?.wallet_enabled || false;
      })
      .addCase(fetchWalletBalance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWalletBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload?.balance || 0;
      })
      .addCase(fetchWalletBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWallet } = walletSlice.actions;
export default walletSlice.reducer;
