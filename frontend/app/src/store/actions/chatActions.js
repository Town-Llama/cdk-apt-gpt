import { UPDATE_MESSAGES, 
    CLEAR_MESSAGES,
    ADD_OPENAI_NOTATION,
    ADD_REACT_NOTATION,
    SET_CONVERSATION_ID,
    SET_COMMUTE_ADDRESS,
    SET_CHAT_STATE,
    SET_POI_ARR,
    SET_POI_DATA
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

export const setPoiData = (obj) => ({
  type: SET_POI_DATA,
  payload: obj
})
export const setPoiArr = (obj) => ({
  type: SET_POI_ARR,
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

export const setCommuteAddress = (cid) => ({
  type: SET_COMMUTE_ADDRESS,
  payload: cid
});

export const setChatState = (state) => ({
  type: SET_CHAT_STATE,
  payload: state
});