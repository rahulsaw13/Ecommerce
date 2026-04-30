import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/api";

// ✅ Get user addresses
export const fetchUserAddresses = createAsyncThunk(
  "address/fetchUserAddresses",
  async (userId, thunkAPI) => {
    try {
      console.log("Fetching addresses for userId:", userId);
      const res = await API.get(`/addresses?user_id=${userId}`);
      console.log("Fetch addresses response:", res.data);
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error("Fetch addresses error:", err.response?.data);
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.response?.data?.error || "Failed to fetch addresses"
      );
    }
  }
);

// ✅ Save new address
export const saveAddress = createAsyncThunk(
  "address/saveAddress",
  async (addressData, thunkAPI) => {
    try {
      console.log("Saving address - REQUEST DATA:", JSON.stringify(addressData, null, 2));
      
      const res = await API.post("/save-addresses", addressData);
      
      console.log("Save address - RESPONSE:", res.data);
      return res.data?.data || res.data;
    } catch (err) {
      console.error("Save address - ERROR STATUS:", err.response?.status);
      console.error("Save address - ERROR DATA:", err.response?.data);
      console.error("Save address - ERROR MESSAGE:", err.message);
      
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error || 
                       err.message || 
                       "Failed to save address";
      
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);

const addressSlice = createSlice({
  name: "address",
  initialState: {
    addresses: [],
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearAddressStatus: (state) => {
      state.error = null;
      state.success = null;
    },
    clearAddresses: (state) => {
      state.addresses = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Fetch Addresses
      .addCase(fetchUserAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
        state.error = null;
      })
      .addCase(fetchUserAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.addresses = [];
      })
      
      // ✅ Save Address
      .addCase(saveAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(saveAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.address_id || action.payload?.id || Date.now();
        if (action.payload) {
          // Add new address to list if returned from API
          const newAddress = {
            id: action.payload?.address_id || action.payload?.id,
            ...action.payload
          };
          state.addresses.push(newAddress);
        }
        state.error = null;
      })
      .addCase(saveAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = null;
      });
  },
});

export const { clearAddressStatus, clearAddresses } = addressSlice.actions;
export default addressSlice.reducer;