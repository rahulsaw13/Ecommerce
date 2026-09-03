import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { allApi } from "../../api/api";

// ✅ Fetch all active products from ERP (used by PlaceOrderPage, ViewCartPage)
export const fetchAllActiveProducts = createAsyncThunk(
  "products/fetchAllActiveProducts",
  async (_, thunkAPI) => {
    try {
      const response = await allApi.get("/user_dashboard/all_active_products");
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message || "Failed to fetch products");
    }
  }
);

// ✅ Fetch a single page of products (used by HomePage infinite scroll)
export const fetchProductsPage = createAsyncThunk(
  "products/fetchProductsPage",
  async ({ page = 0, size = 50, categoryId = null } = {}, thunkAPI) => {
    try {
      let url = `/user_dashboard/all_active_products?page=${page}&size=${size}`;
      if (categoryId) url += `&categoryId=${categoryId}`;
      const response = await allApi.get(url);
      return { ...response.data, page, categoryId };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message || "Failed to fetch products");
    }
  }
);

// ✅ Fetch all categories from ERP
export const fetchAllCategories = createAsyncThunk(
  "products/fetchAllCategories",
  async (_, thunkAPI) => {
    try {
      const response = await allApi.get("/user_dashboard/all_categories");
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message || "Failed to fetch categories");
    }
  }
);

// ✅ Fetch active home page sections
export const fetchHomeSections = createAsyncThunk(
  "products/fetchHomeSections",
  async (_, thunkAPI) => {
    try {
      const response = await allApi.get("/user_dashboard/home_sections");
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message || "Failed to fetch home sections");
    }
  }
);



export const fetchBestSellingByCategory = createAsyncThunk(
  "products/fetchBestSellingByCategory",
  async (_, thunkAPI) => {
    try {
      const response = await allApi.get("/user_dashboard/bestselling_by_category");
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message || "Failed to fetch bestselling by category");
    }
  }
);

// Add this to your productSlice.js
export const fetchMenuList = createAsyncThunk(
  "products/fetchMenuList",
  async (_, thunkAPI) => {
    try {
      const response = await allApi.get("/user_dashboard/nav_menu_list");
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch menu");
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    categories: [],
    homeSections: [],
    bestSellingByCategory: [],
    selectedProduct: null,
    categoryProducts: [],
    menuList: [],
    loading: false,
    loadingMore: false,
    productsLoaded: false,
    hasMore: true,
    currentPage: 0,
    error: null,
    totalProducts: 0,
  },
  reducers: {
    clearProducts: (state) => {
      state.products = [];
      state.productsLoaded = false;
      state.hasMore = true;
      state.currentPage = 0;
      state.loadingMore = false;
      state.error = null;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    clearCategories: (state) => {
      state.categories = [];
    },
    clearHomeSections: (state) => {
      state.homeSections = [];
    },
    clearCategoryProducts: (state) => {
      state.categoryProducts = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Fetch all active products
      .addCase(fetchAllActiveProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllActiveProducts.fulfilled, (state, action) => {
  state.loading = false;
  state.productsLoaded = true;
  // Your API returns { products: [...] }
  if (action.payload?.products) {
    state.products = action.payload.products;
  } else if (Array.isArray(action.payload)) {
    state.products = action.payload;
  } else {
    state.products = [];
  }
  state.totalProducts = state.products.length;
  console.log("Products stored in Redux:", state.products.length);
  state.error = null;
})
      
      // ✅ Fetch all categories
      .addCase(fetchAllCategories.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        // Handle different response structures
        if (action.payload?.data) {
          state.categories = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.categories = action.payload;
        } else if (action.payload?.categories) {
          state.categories = action.payload.categories;
        } else {
          state.categories = [];
        }
        console.log("Categories loaded:", state.categories.length);
        state.error = null;
      })
      .addCase(fetchAllCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.categories = [];
      })
      
      // ✅ Fetch home sections
      .addCase(fetchHomeSections.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchHomeSections.fulfilled, (state, action) => {
        // Handle different response structures
        if (action.payload?.data) {
          state.homeSections = action.payload.data;
        } else if (Array.isArray(action.payload)) {
          state.homeSections = action.payload;
        } else if (action.payload?.sections) {
          state.homeSections = action.payload.sections;
        } else {
          state.homeSections = [];
        }
        console.log("Home sections loaded:", state.homeSections.length);
        state.error = null;
      })
      .addCase(fetchHomeSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.homeSections = [];
      })

      .addCase(fetchBestSellingByCategory.fulfilled, (state, action) => {
        state.bestSellingByCategory = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchBestSellingByCategory.rejected, (state) => {
        state.bestSellingByCategory = [];
      })

      // ✅ Paginated product fetch (HomePage infinite scroll)
      .addCase(fetchProductsPage.pending, (state, action) => {
        const isFirstPage = action.meta.arg?.page === 0;
        if (isFirstPage) {
          state.loading = true;
          state.products = [];
        } else {
          state.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchProductsPage.fulfilled, (state, action) => {
        const { products = [], total = 0, hasMore = false, page = 0 } = action.payload;
        state.loading = false;
        state.loadingMore = false;
        state.productsLoaded = true;
        if (page === 0) {
          state.products = products;
        } else {
          state.products = [...state.products, ...products];
        }
        state.hasMore = hasMore;
        state.currentPage = page;
        state.totalProducts = total;
        state.error = null;
      })
      .addCase(fetchProductsPage.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      });



  },
  
});

export const {
  clearProducts,
  clearSelectedProduct,
  clearCategories,
  clearHomeSections,
  clearCategoryProducts
} = productSlice.actions;

export default productSlice.reducer;