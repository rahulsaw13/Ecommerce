import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { allApi } from "../../api/api";
import { API_CONSTANTS } from "../../constants/apiurl";

const DEFAULT_COMPANY = {
  name: "Dukaansarthi",
  address: "Dukaansarthi Address",
  phone: "",
  email: "",
  gstin: "",
  pan: "",
  pincode: "",
  logo_url: "",
  upi_id: "",
  customer_care_no: "",
  website: "",
  latitude: 0,
  longitude: 0,
  currency: "INR",
  company_id: null,
  branch_id: null,
};

export const fetchCompanyInfo = createAsyncThunk(
  "company/fetchCompanyInfo",
  async (_, thunkAPI) => {
    try {
      const res = await allApi.get(`/${API_CONSTANTS.COMPANY_INFO_URL}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

const companySlice = createSlice({
  name: "company",
  initialState: {
    info: DEFAULT_COMPANY,
    loaded: false,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.info = { ...DEFAULT_COMPANY, ...action.payload };
      })
      .addCase(fetchCompanyInfo.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.error = action.payload;
        // Keep defaults on failure so the app still renders
      });
  },
});

export default companySlice.reducer;
