import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CallStatus =
  | "idle"
  | "calling"
  | "receiving"
  | "ongoing"
  | "ended"
  | "error";

interface CallState {
  status: CallStatus;
  partner: {
    id: string;
    name: string;
    image?: string;
  } | null;
  isMuted: boolean;
  isVideo: boolean;
  errorMessage: string | null;
}

const initialState: CallState = {
  status: "idle",
  partner: null,
  isMuted: false,
  isVideo: false,
  errorMessage: null,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    initiateCall: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        image?: string;
        isVideo?: boolean;
      }>,
    ) => {
      state.status = "calling";
      state.partner = action.payload;
      state.isVideo = !!action.payload.isVideo;
      state.errorMessage = null;
    },
    incomingCall: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        image?: string;
        isVideo?: boolean;
      }>,
    ) => {
      state.status = "receiving";
      state.partner = action.payload;
      state.isVideo = !!action.payload.isVideo;
    },
    acceptCall: (
      state,
      action: PayloadAction<
        { id: string; name: string; image?: string } | undefined
      >,
    ) => {
      state.status = "ongoing";
      if (action.payload) {
        state.partner = action.payload;
      }
    },
    endCall: (state) => {
      state.status = "idle";
      state.partner = null;
      state.isMuted = false;
      state.isVideo = false;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.status = "error";
      state.errorMessage = action.payload;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
  },
});

export const {
  initiateCall,
  incomingCall,
  acceptCall,
  endCall,
  setError,
  toggleMute,
} = callSlice.actions;
export default callSlice.reducer;
