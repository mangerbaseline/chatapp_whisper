import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface Plan {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  tokens: number;
  isActive: boolean;
}

interface Transaction {
  _id: string;
  type: "purchase" | "transfer_sent" | "transfer_received" | "redemption";
  amount: number;
  balanceAfter: number;
  amountMoney?: number;
  currency?: string;
  plan?: { _id: string; name: string };
  fromUser?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  toUser?: { _id: string; firstName: string; lastName: string; email: string };
  note?: string;
  createdAt: string;
}

interface WalletState {
  balance: number;
  plans: Plan[];
  transactions: Transaction[];
  totalTransactions: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  receivedAmount?: number;
  feeAmount?: number;
}

interface ApiError {
  message: string;
}

const initialState: WalletState = {
  balance: 0,
  plans: [],
  transactions: [],
  totalTransactions: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  successMessage: null,
};

export const fetchBalance = createAsyncThunk<
  number,
  void,
  { rejectValue: ApiError }
>("wallet/fetchBalance", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get("/api/tokens/balance");
    return res.data.data.balance;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Failed to fetch balance",
    });
  }
});

export const fetchPlans = createAsyncThunk<
  Plan[],
  void,
  { rejectValue: ApiError }
>("wallet/fetchPlans", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get("/api/plans");
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Failed to fetch plans",
    });
  }
});

export const createCheckoutSession = createAsyncThunk<
  { sessionId: string; url: string },
  string,
  { rejectValue: ApiError }
>("wallet/createCheckoutSession", async (planId, { rejectWithValue }) => {
  try {
    const res = await axios.post("/api/tokens/purchase", { planId });
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Failed to create checkout",
    });
  }
});

export const verifyPurchase = createAsyncThunk<
  { balance: number; tokensAdded: number },
  string,
  { rejectValue: ApiError }
>("wallet/verifyPurchase", async (sessionId, { rejectWithValue }) => {
  try {
    const res = await axios.post("/api/tokens/purchase/verify", { sessionId });
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Failed to verify purchase",
    });
  }
});

export const transferTokens = createAsyncThunk<
  { balance: number },
  { toUserId: string; amount: number; note?: string },
  { rejectValue: ApiError }
>("wallet/transferTokens", async (data, { rejectWithValue }) => {
  try {
    const res = await axios.post("/api/tokens/transfer", data);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Transfer failed",
    });
  }
});

export const redeemTokens = createAsyncThunk<
  { newBalance: number; receivedUsd: number; feeUsd: number; message: string },
  { amountTokens: number },
  { rejectValue: ApiError }
>("wallet/redeemTokens", async (data, { rejectWithValue }) => {
  try {
    const res = await axios.post("/api/tokens/redeem", data);
    return { ...res.data.data, message: res.data.message };
  } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || "Redemption failed",
    });
  }
});

export const fetchHistory = createAsyncThunk<
  {
    transactions: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  },
  { page?: number; limit?: number },
  { rejectValue: ApiError }
>(
  "wallet/fetchHistory",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `/api/tokens/history?page=${page}&limit=${limit}`,
      );
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to fetch history",
      });
    }
  },
);

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    clearWalletState(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBalance
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.balance = action.payload;
      })
      // fetchPlans
      .addCase(fetchPlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = action.payload;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      // createCheckoutSession
      .addCase(createCheckoutSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCheckoutSession.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      // verifyPurchase
      .addCase(verifyPurchase.fulfilled, (state, action) => {
        state.balance = action.payload.balance;
        state.successMessage = `${action.payload.tokensAdded} tokens added!`;
      })
      // transferTokens
      .addCase(transferTokens.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(transferTokens.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload.balance;
        state.successMessage = "Tokens sent successfully!";
      })
      .addCase(transferTokens.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      // fetchHistory
      .addCase(fetchHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.totalTransactions = action.payload.total;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      })
      // redeemTokens
      .addCase(redeemTokens.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(redeemTokens.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload.newBalance;
        state.receivedAmount = action.payload.receivedUsd;
        state.feeAmount = action.payload.feeUsd;
        state.successMessage = action.payload.message;
      })
      .addCase(redeemTokens.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || null;
      });
  },
});

export const { clearWalletState } = walletSlice.actions;
export default walletSlice.reducer;
