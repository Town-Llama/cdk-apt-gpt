export const initialChatState = {
    openAINotation: [],
    reactNotation: [],
    conversationId: null,
    commuteAddress: {},
    poiArr: [],
    poiData: {},
    chatState: "BEGIN"
};


export const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
export const CLEAR_MESSAGES = "CLEAR_MESSAGES";
export const ADD_OPENAI_NOTATION = "ADD_OPENAI_NOTATION";
export const ADD_REACT_NOTATION = "ADD_REACT_NOTATION";
export const SET_CONVERSATION_ID = "SET_CONVERSATION_ID";
export const SET_COMMUTE_ADDRESS = "SET_COMMUTE_ADDRESS";
export const SET_CHAT_STATE = "SET_CHAT_STATE";
export const SET_POI_ARR = "SET_POI_ARR";
export const SET_POI_DATA = "SET_POI_DATA";