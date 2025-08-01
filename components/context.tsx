import React, { createContext, useReducer, useContext, useMemo } from "react";

// ---------------------------
// Initial State
// ---------------------------
const initialState = {
  userId: null,
  sentNewMessage: false,
  deletedConversation: false,
  selectedChat: null,
  isSubscriptionLoading: false,
};

// ---------------------------
// Reducer
// ---------------------------
function chatReducer(state, action) {
  switch (action.type) {
    case "SET_USER_ID":
      return { ...state, userId: action.payload };
    case "SET_SELECTED_CHAT":
      return { ...state, selectedChat: action.payload };
    case "SET_SUBSCRIPTION_LOADING":
      return { ...state, isSubscriptionLoading: action.payload };
    case "SENT_NEW_MESSAGE":
      return { ...state, sentNewMessage: action.payload };
    case "DELETED_CONVERSATION":
      return { ...state, deletedConversation: action.payload };
    default:
      return state;
  }
}

// ---------------------------
// Context Creation
// ---------------------------
const ChatStateContext = createContext(undefined);
const ChatDispatchContext = createContext(undefined);

// ---------------------------
// Provider
// ---------------------------

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const memoizedState = useMemo(() => state, [state]);

  return (
    <ChatStateContext.Provider value={memoizedState}>
      <ChatDispatchContext.Provider value={dispatch}>
        {children}
      </ChatDispatchContext.Provider>
    </ChatStateContext.Provider>
  );
}

// ---------------------------
// Custom Hooks
// ---------------------------
export function useChatState() {
  const context = useContext(ChatStateContext);
  if (context === undefined) {
    throw new Error("useChatState must be used within a ChatProvider");
  }
  return context;
}

export function useChatDispatch() {
  const context = useContext(ChatDispatchContext);
  if (context === undefined) {
    throw new Error("useChatDispatch must be used within a ChatProvider");
  }
  return context;
}
