import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import adminReducer from "./features/admin/adminSlice";
import chatReducer from "./features/chat/chatSlice";
import callReducer from "./features/chat/callSlice";
import connectionsReducer from "./features/connections/connectionsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    chat: chatReducer,
    call: callReducer,
    connections: connectionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
