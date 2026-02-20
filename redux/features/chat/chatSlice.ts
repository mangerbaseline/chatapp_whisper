import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Message {
  _id: string;
  sender:
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        email: string;
        image?: string;
      }
    | string;
  text: string;
  attachments?: Attachment[];
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  _id: string;
  participants: any[];
  lastMessage?: {
    text: string;
    createdAt: string;
  };
  updatedAt: string;
  isGroup?: boolean;
  name?: string;
  groupAdmin?: string;
}

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  currentConversation: Conversation | null;
  selectedConversationId: string | null;
  loading: boolean;
  messagesLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  messages: [],
  currentConversation: null,
  selectedConversationId: null,
  loading: false,
  messagesLoading: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/conversations");
      return res.data.data as Conversation[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch conversations",
      );
    }
  },
);

export const createConversation = createAsyncThunk(
  "chat/createConversation",
  async (
    data: {
      otherUserId?: string;
      isGroup?: boolean;
      name?: string;
      members?: string[];
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axios.post("/api/conversations", data);
      return res.data.data as Conversation;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create conversation",
      );
    }
  },
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `/api/conversations/${conversationId}/messages`,
      );
      return res.data.data as Message[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch messages",
      );
    }
  },
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (
    {
      conversationId,
      text,
      attachments,
    }: { conversationId: string; text: string; attachments?: Attachment[] },
    { rejectWithValue },
  ) => {
    try {
      const res = await axios.post(
        `/api/conversations/${conversationId}/messages`,
        {
          text,
          attachments,
        },
      );
      return res.data.data as Message;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send message",
      );
    }
  },
);

export const fetchConversationDetails = createAsyncThunk(
  "chat/fetchConversationDetails",
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/conversations/${conversationId}`);
      return res.data.data as Conversation;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch conversation details",
      );
    }
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    selectConversation: (state, action: PayloadAction<string | null>) => {
      state.selectedConversationId = action.payload;
    },
    clearSelection: (state) => {
      state.selectedConversationId = null;
      state.messages = [];
      state.currentConversation = null;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const index = state.messages.findIndex(
        (m) => m._id === action.payload._id,
      );
      if (index === -1) {
        state.messages.push(action.payload);
      } else {
        state.messages[index] = action.payload;
      }
    },
    updateConversation: (state, action: PayloadAction<Conversation>) => {
      const index = state.conversations.findIndex(
        (c) => c._id === action.payload._id,
      );
      if (index !== -1) {
        state.conversations[index] = action.payload;
      } else {
        state.conversations.unshift(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.selectedConversationId = action.payload._id;
      })
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.messagesLoading = false;
      })
      // Send Message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const index = state.messages.findIndex(
          (m) => m._id === action.payload._id,
        );
        if (index === -1) {
          state.messages.push(action.payload);
        } else {
          state.messages[index] = action.payload;
        }
      })
      // Fetch Conversation Details
      .addCase(fetchConversationDetails.fulfilled, (state, action) => {
        state.currentConversation = action.payload;
      });
  },
});

export const {
  selectConversation,
  clearSelection,
  addMessage,
  updateConversation,
} = chatSlice.actions;
export default chatSlice.reducer;
