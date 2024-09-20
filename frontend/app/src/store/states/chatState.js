export const initialChatState = {
    openAINotation: [],
    reactNotation: [],
    conversationId: null,
    query: null,
    df: [],
    comparingIndices: [],
    chatState: "BEGIN"
};

export const UPDATE_QUERY = "UPDATE_QUERY";
export const UPDATE_COMPARING_INDICES = "UPDATE_COMPARING_INDICES";
export const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
export const CLEAR_MESSAGES = "CLEAR_MESSAGES";
export const ADD_OPENAI_NOTATION = "ADD_OPENAI_NOTATION";
export const ADD_REACT_NOTATION = "ADD_REACT_NOTATION";
export const SET_CONVERSATION_ID = "SET_CONVERSATION_ID";
export const SET_CHAT_STATE = "SET_CHAT_STATE";
export const SET_DF = "SET_DF";