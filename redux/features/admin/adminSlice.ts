import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface AdminState {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  users: any[];
}

interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  address?: string;
}

interface UpdateUserStatusPayload {
  userId: string;
  isActive: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface ApiError {
  message: string;
}

const initialState: AdminState = {
  isLoading: false,
  error: null,
  successMessage: null,
  users: [],
};

export const createUserByAdmin = createAsyncThunk<
  { message: string },
  CreateUserPayload,
  { rejectValue: ApiError }
>("admin/createUser", async (data, { rejectWithValue }) => {
  try {
    const res = await axios.post("/api/admin/users/create-user", data);

    return {
      message: res.data.message,
    };
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Failed to create user",
    });
  }
});

export const updateUserStatus = createAsyncThunk<
  { message: string },
  UpdateUserStatusPayload,
  { rejectValue: ApiError }
>(
  "admin/updateUserStatus",
  async ({ userId, isActive }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/api/admin/users/${userId}`, {
        isActive,
      });

      return {
        message: res.data.message,
      };
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to update user status",
      });
    }
  },
);

export const getUsers = createAsyncThunk<
  User[],
  void,
  { rejectValue: ApiError }
>("admin/getUsers", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get("/api/admin/users");
    return res.data.data || res.data;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Failed to fetch users",
    });
  }
});

export const deleteUser = createAsyncThunk<
  { message: string },
  string,
  { rejectValue: ApiError }
>("admin/deleteUser", async (id, { rejectWithValue }) => {
  try {
    const res = await axios.delete(`/api/admin/users/${id}`);
    return {
      message: res.data.message,
    };
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Failed to delete user",
    });
  }
});

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminState(state) {
      state.error = null;
      state.successMessage = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createUserByAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUserByAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(createUserByAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      .addCase(updateUserStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      .addCase(getUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      });
  },
});

export const { clearAdminState } = adminSlice.actions;
export default adminSlice.reducer;
