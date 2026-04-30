// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import API from "../../services/api";

// // ✅ SIGNUP API
// export const signupUser = createAsyncThunk(
//   "auth/signupUser",
//   async (data, thunkAPI) => {
//     try {
//       const res = await API.post("/users", data);
//      console.log("response = ",res)

//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data || "Signup failed");
//     }
//   }
// );

// // ✅ LOGIN API
// export const loginUser = createAsyncThunk(
//   "auth/loginUser",
//   async (data, thunkAPI) => {
//     try {
//       const res = await API.post("/users/sign_in", data);
//       console.log("response = ",res)
//       // Return full response structure including headers and data
//       return {
//         data: res.data,
//         headers: res.headers,
//         token: res.headers?.authorization || res.data?.token
//       };
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data || err.response?.data?.error || "Login failed");
//     }
//   }
// );

// const authSlice = createSlice({
//   name: "auth",
//   initialState: {
//     user: null,
//     signupSuccess: false,
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     clearStatus: (state) => {
//       state.signupSuccess = false;
//       state.error = null;
//     },
//     logout: (state) => {
//       state.user = null;
//       state.error = null;
//       localStorage.removeItem("token");
//       localStorage.removeItem("userDetails");
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // ✅ SIGNUP
//       .addCase(signupUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(signupUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.signupSuccess = true;
//         state.user = action.payload;
//       })
//       .addCase(signupUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // ✅ LOGIN
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload;
//         state.error = null;
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const { clearStatus, logout } = authSlice.actions;
// export default authSlice.reducer;





import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/api";

// ✅ SIGNUP API
export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (data, thunkAPI) => {
    try {
      const res = await API.post("/users", data);
      console.log("Signup response = ", res);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Signup failed");
    }
  }
);

// ✅ LOGIN API
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (data, thunkAPI) => {
    try {
      const res = await API.post("/users/sign_in", data);
      console.log("Login response = ", res);
      
      const token = res.headers?.authorization || res.data?.token;
      const userData = res.data?.data || res.data?.user || res.data;
      
      if (token) {
        localStorage.setItem("token", JSON.stringify(token));
      }
      if (userData) {
        localStorage.setItem("userDetails", JSON.stringify(userData));
      }
      
      return {
        user: userData,
        token: token,
        headers: res.headers,
        data: res.data
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "Login failed"
      );
    }
  }
);

// ✅ FORGOT PASSWORD - Send OTP to email
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (data, thunkAPI) => {
    try {
      const res = await API.post("/users/forget_password", data);
      console.log("Forgot password response = ", res);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "Failed to send reset link"
      );
    }
  }
);

// ✅ RESET PASSWORD - Verify OTP and set new password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (data, thunkAPI) => {
    try {
      const res = await API.post("/users/reset_password", data);
      console.log("Reset password response = ", res);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "Failed to reset password"
      );
    }
  }
);

// ✅ GOOGLE SIGN IN
export const googleSignIn = createAsyncThunk(
  "auth/googleSignIn",
  async (data, thunkAPI) => {
    try {
      const res = await API.post("/users/google_signin", data);
      console.log("Google sign in response = ", res);
      
      const token = res.headers?.authorization || res.data?.token;
      const userData = res.data?.data || res.data?.user || res.data;
      
      if (token) {
        localStorage.setItem("token", JSON.stringify(token));
      }
      if (userData) {
        localStorage.setItem("userDetails", JSON.stringify(userData));
      }
      
      return {
        user: userData,
        token: token,
        headers: res.headers,
        data: res.data
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "Google sign in failed"
      );
    }
  }
);

// ✅ FETCH USER PROFILE
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (userId, thunkAPI) => {
    try {
      const res = await API.get(`/users/${userId}`);
      console.log("User profile response = ", res);
      
      const userData = res.data?.data || res.data?.user || res.data;
      
      if (userData) {
        localStorage.setItem("userDetails", JSON.stringify(userData));
      }
      
      return userData;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "Failed to fetch user profile"
      );
    }
  }
);

// ✅ LOGOUT
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, thunkAPI) => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userDetails");
      return { success: true };
    } catch (err) {
      return thunkAPI.rejectWithValue("Logout failed");
    }
  }
);

// ✅ UPDATE USER PROFILE
export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async ({ userId, userData }, thunkAPI) => {
    try {
      const res = await API.put(`/users/${userId}`, userData);
      console.log("Update profile response = ", res);
      
      const updatedUser = res.data?.data || res.data?.user || res.data;
      
      if (updatedUser) {
        localStorage.setItem("userDetails", JSON.stringify(updatedUser));
      }
      
      return updatedUser;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "Failed to update profile"
      );
    }
  }
);

// ✅ CHANGE PASSWORD
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwordData, thunkAPI) => {
    try {
      const res = await API.post("/users/change_password", passwordData);
      console.log("Change password response = ", res);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "Failed to change password"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    signupSuccess: false,
    loading: false,
    error: null,
    isAuthenticated: false,
    profileLoading: false,
    // Forgot/Reset Password states
    forgotPasswordSuccess: false,
    forgotPasswordLoading: false,
    resetPasswordSuccess: false,
    resetPasswordLoading: false,
    // Google Sign In state
    googleLoading: false,
  },
  reducers: {
    clearStatus: (state) => {
      state.signupSuccess = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearUserProfile: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.signupSuccess = false;
    },
    clearForgotPasswordStatus: (state) => {
      state.forgotPasswordSuccess = false;
      state.forgotPasswordLoading = false;
      state.error = null;
    },
    clearResetPasswordStatus: (state) => {
      state.resetPasswordSuccess = false;
      state.resetPasswordLoading = false;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.signupSuccess = false;
      state.forgotPasswordSuccess = false;
      state.resetPasswordSuccess = false;
      localStorage.removeItem("token");
      localStorage.removeItem("userDetails");
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    checkAuth: (state) => {
      const token = localStorage.getItem("token");
      const userDetails = localStorage.getItem("userDetails");
      
      if (token && userDetails) {
        try {
          state.user = JSON.parse(userDetails);
          state.isAuthenticated = true;
        } catch (e) {
          state.user = null;
          state.isAuthenticated = false;
        }
      } else {
        state.user = null;
        state.isAuthenticated = false;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // ✅ SIGNUP
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.signupSuccess = false;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.signupSuccess = true;
        state.user = action.payload?.data || action.payload?.user || action.payload;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.signupSuccess = false;
      })
      
      // ✅ LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // ✅ FORGOT PASSWORD
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.error = null;
        state.forgotPasswordSuccess = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordSuccess = true;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordSuccess = false;
        state.error = action.payload;
      })
      
      // ✅ RESET PASSWORD
      .addCase(resetPassword.pending, (state) => {
        state.resetPasswordLoading = true;
        state.error = null;
        state.resetPasswordSuccess = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = true;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccess = false;
        state.error = action.payload;
      })
      
      // ✅ GOOGLE SIGN IN
      .addCase(googleSignIn.pending, (state) => {
        state.googleLoading = true;
        state.error = null;
      })
      .addCase(googleSignIn.fulfilled, (state, action) => {
        state.googleLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(googleSignIn.rejected, (state, action) => {
        state.googleLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // ✅ FETCH USER PROFILE
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      })
      
      // ✅ LOGOUT
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.signupSuccess = false;
        state.forgotPasswordSuccess = false;
        state.resetPasswordSuccess = false;
        localStorage.removeItem("token");
        localStorage.removeItem("userDetails");
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem("token");
        localStorage.removeItem("userDetails");
      })
      
      // ✅ UPDATE USER PROFILE
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ CHANGE PASSWORD
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearStatus, 
  clearError,
  clearUserProfile,
  clearForgotPasswordStatus,
  clearResetPasswordStatus,
  logout, 
  setUser,
  checkAuth 
} = authSlice.actions;

export default authSlice.reducer;