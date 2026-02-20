import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  image?: string;
  inviteStatus?: string;
  invitationId?: string;
}

export interface Connection {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  image?: string;
}

export interface Invitation {
  _id: string;
  sender: User;
  receiver: User;
  status: string;
  createdAt: string;
}

interface ConnectionsState {
  connections: Connection[];
  receivedInvitations: Invitation[];
  sentInvitations: Invitation[];
  searchResults: User[];
  loading: boolean;
  error: string | null;
}

const initialState: ConnectionsState = {
  connections: [],
  receivedInvitations: [],
  sentInvitations: [],
  searchResults: [],
  loading: false,
  error: null,
};

export const fetchConnections = createAsyncThunk(
  "connections/fetchConnections",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/connections");
      return res.data.data as Connection[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch connections",
      );
    }
  },
);

export const removeConnection = createAsyncThunk(
  "connections/removeConnection",
  async (connectionId: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/connections/${connectionId}`);
      return connectionId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove connection",
      );
    }
  },
);

export const fetchInvitations = createAsyncThunk(
  "connections/fetchInvitations",
  async (
    { type, status }: { type: "sent" | "received"; status: "pending" },
    { rejectWithValue },
  ) => {
    try {
      const res = await axios.get(
        `/api/invitations?type=${type}&status=${status}`,
      );
      return { type, data: res.data.data as Invitation[] };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch invitations",
      );
    }
  },
);

export const sendInvitation = createAsyncThunk(
  "connections/sendInvitation",
  async (receiverId: string, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/invitations", { receiverId });
      return res.data.data as Invitation;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send invitation",
      );
    }
  },
);

export const acceptInvitation = createAsyncThunk(
  "connections/acceptInvitation",
  async (invitationId: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/api/invitations/${invitationId}/accept`);
      return { invitationId, connection: res.data.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to accept invitation",
      );
    }
  },
);

export const rejectInvitation = createAsyncThunk(
  "connections/rejectInvitation",
  async (invitationId: string, { rejectWithValue }) => {
    try {
      await axios.post(`/api/invitations/${invitationId}/reject`);
      return invitationId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject invitation",
      );
    }
  },
);

export const searchUsers = createAsyncThunk(
  "connections/searchUsers",
  async (query: string, { rejectWithValue }) => {
    try {
      if (!query.trim()) return [];
      const res = await axios.get(`/api/users/search?q=${query}`);
      return res.data.data as User[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search users",
      );
    }
  },
);

const connectionsSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {
    clearConnectionsError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    addReceivedInvitation: (state, action: PayloadAction<Invitation>) => {
      state.receivedInvitations.unshift(action.payload);
    },
    addConnection: (state, action: PayloadAction<Connection>) => {
      state.connections.push(action.payload);
    },
    removeInvitation: (state, action: PayloadAction<string>) => {
      state.receivedInvitations = state.receivedInvitations.filter(
        (inv) => inv._id !== action.payload,
      );
      state.sentInvitations = state.sentInvitations.filter(
        (inv) => inv._id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Connections
      .addCase(fetchConnections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchConnections.fulfilled,
        (state, action: PayloadAction<Connection[]>) => {
          state.connections = action.payload;
          state.loading = false;
        },
      )
      .addCase(fetchConnections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove Connection
      .addCase(removeConnection.pending, (state) => {
        state.error = null;
      })
      .addCase(
        removeConnection.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.connections = state.connections.filter(
            (c) => c._id !== action.payload,
          );
        },
      )
      .addCase(removeConnection.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Invitations
      .addCase(fetchInvitations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvitations.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.type === "sent") {
          state.sentInvitations = action.payload.data;
        } else {
          state.receivedInvitations = action.payload.data;
        }
      })
      .addCase(fetchInvitations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send Invitation
      .addCase(sendInvitation.fulfilled, (state, action) => {
        state.sentInvitations.unshift(action.payload);
        const receiverId = action.payload.receiver._id;
        state.searchResults = state.searchResults.map((user) =>
          user._id === receiverId
            ? { ...user, inviteStatus: "pending_sent" }
            : user,
        );
      })
      // Accept Invitation
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        state.receivedInvitations = state.receivedInvitations.filter(
          (inv) => inv._id !== action.payload.invitationId,
        );
      })
      // Reject Invitation
      .addCase(rejectInvitation.fulfilled, (state, action) => {
        state.receivedInvitations = state.receivedInvitations.filter(
          (inv) => inv._id !== action.payload,
        );
        state.sentInvitations = state.sentInvitations.filter(
          (inv) => inv._id !== action.payload,
        );
      })
      // Search Users
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchResults = action.payload;
        state.loading = false;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearConnectionsError,
  clearSearchResults,
  addReceivedInvitation,
  removeInvitation,
  addConnection,
} = connectionsSlice.actions;
export default connectionsSlice.reducer;
