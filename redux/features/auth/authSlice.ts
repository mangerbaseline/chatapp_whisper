import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface AuthState {
  isLoading: boolean;
  user: any | null;
  resetToken: string | null;
  error: string | null;
  successMessage: string | null;
  users?: any[];
}

interface forgotPassword {
  email: string;
}

interface ApiError {
  message: string;
}

interface GoogleLoginResponse {
  data: any;
  message: string;
}

interface GithubLoginResponse {
  data: any;
  message: string;
}

const initialState: AuthState = {
  isLoading: false,
  user: null,
  resetToken: null,
  error: null,
  successMessage: null,
};

export const forgotPassword = createAsyncThunk<
  string,
  { email: string },
  { rejectValue: ApiError }
>("auth/forgotPassword", async (data, { rejectWithValue }) => {
  try {
    const res = await axios.post("/api/auth/forgot-password", data);
    return res.data.message;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Failed to send OTP",
    });
  }
});

export const verifyOtp = createAsyncThunk<
  { resetToken: string },
  { email: string; otp: string },
  { rejectValue: ApiError }
>("auth/verifyOtp", async (data, { rejectWithValue }) => {
  try {
    const res = await axios.post("/api/auth/verify-forgot-otp", data);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "OTP verification failed",
    });
  }
});

export const resetPassword = createAsyncThunk<
  string,
  { resetToken: string; newPassword: string },
  { rejectValue: ApiError }
>("auth/resetPassword", async (data, { rejectWithValue }) => {
  try {
    const res = await axios.post("/api/auth/reset-password", data);
    return res.data.message;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Password reset failed",
    });
  }
});

export const googleLogin = createAsyncThunk<
  GoogleLoginResponse,
  { token: string },
  { rejectValue: ApiError }
>("auth/googleLogin", async (data, { rejectWithValue }) => {
  try {
    const res = await axios.post("/api/auth/google", data);
    return res.data;
  } catch (error: any) {
    return rejectWithValue({
      message: error.response?.data?.message || "Google login failed",
    });
  }
});

export const githubLogin = createAsyncThunk<
  GithubLoginResponse,
  { code: string },
  { rejectValue: ApiError }
>(
  "auth/githubLogin",
  async ({ code }: { code: string }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/auth/github", { code });

      const data = await res.data;

      return data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.response?.data?.message || "Github login failed.",
      });
    }
  },
);

export const register = createAsyncThunk<any, any, { rejectValue: ApiError }>(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/auth/register", data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Registration failed",
      });
    }
  },
);

export const login = createAsyncThunk<any, any, { rejectValue: ApiError }>(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/auth/login", data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Login failed",
      });
    }
  },
);

export const me = createAsyncThunk<any, void, { rejectValue: ApiError }>(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/auth/me");
      return res.data;
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to fetch user",
      });
    }
  },
);

export const logout = createAsyncThunk<any, void, { rejectValue: ApiError }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/auth/logout");
      return res.data;
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Logout failed",
      });
    }
  },
);

export const updateUser = createAsyncThunk<any, any, { rejectValue: ApiError }>(
  "auth/updateUser",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.patch("/api/auth/update", data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Update failed",
      });
    }
  },
);

export const updatePassword = createAsyncThunk<
  any,
  any,
  { rejectValue: ApiError }
>("auth/updatePassword", async (data, { rejectWithValue }) => {
  try {
    const res = await axios.patch("/api/auth/change-password", data);
    return res.data;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Password update failed",
    });
  }
});

export const updateProfileImage = createAsyncThunk<
  any,
  FormData,
  { rejectValue: ApiError }
>("auth/updateProfileImage", async (formData, { rejectWithValue }) => {
  try {
    const res = await axios.patch("/api/auth/profile-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Profile image upload failed",
    });
  }
});

export const deleteAccount = createAsyncThunk<
  any,
  void,
  { rejectValue: ApiError }
>("auth/deleteAccount", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.delete("/api/auth/delete-account");
    return res.data;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Account deletion failed",
    });
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
    clearAuthState(state) {
      state.error = null;
      state.successMessage = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })

      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resetToken = action.payload.resetToken;
        state.successMessage = "OTP verified successfully";
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })

      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload;
        state.resetToken = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })

      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? null;
      })
      .addCase(githubLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(githubLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.error = null;
      })
      .addCase(githubLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message ?? null;
      })

      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.successMessage = action.payload.message;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.successMessage = action.payload.message;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      .addCase(me.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(me.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data || action.payload;
      })
      .addCase(me.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.error = action.payload?.message || null;
      })
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.successMessage = "Logged out successfully";
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.successMessage = action.payload.message;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      .addCase(updatePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      .addCase(deleteAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.successMessage = "Account deleted successfully";
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      .addCase(updateProfileImage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.image = action.payload.data.image;
        }
        state.successMessage = action.payload.message;
      })
      .addCase(updateProfileImage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      });
  },
});

export const { setUser, clearUser, clearAuthState } = authSlice.actions;
export default authSlice.reducer;
