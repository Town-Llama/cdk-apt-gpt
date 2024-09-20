import {
  initialChatState,
  UPDATE_MESSAGES,
  CLEAR_MESSAGES,
  ADD_OPENAI_NOTATION,
  ADD_REACT_NOTATION,
  SET_CONVERSATION_ID,
  SET_DF,
  UPDATE_QUERY,
  SET_CHAT_STATE,
  UPDATE_COMPARING_INDICES
} from '../states/chatState';

export const dialogue = (
  userMessage,
  userReactComponent,
  assistantMessage,
  assistantReactComponent
) => ({
  type: UPDATE_MESSAGES,
  payload: {
    userMessage,
    userReactComponent,
    assistantMessage,
    assistantReactComponent
  },
});

export const updateComparingIndices = (obj) => ({
  type: UPDATE_COMPARING_INDICES,
  payload: obj
})

export const updateQuery = (obj) => ({
  type: UPDATE_QUERY,
  payload: obj
})

export const addOpenAINotation = (obj) => ({
  type: ADD_OPENAI_NOTATION,
  payload: obj
})

export const addReactNotation = (obj) => ({
  type: ADD_REACT_NOTATION,
  payload: obj
})

export const clearChat = () => ({
  type: CLEAR_MESSAGES,
  payload: {},
});

export const setConversationId = (cid) => ({
  type: SET_CONVERSATION_ID,
  payload: cid
});

export const setDf = (cid) => ({
  type: SET_DF,
  payload: cid
});

export const setChatState = (state) => ({
  type: SET_CHAT_STATE,
  payload: state
});