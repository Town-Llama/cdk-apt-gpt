// src/reducers/recReducer.js
import { initialChatState, 
    UPDATE_MESSAGES, 
    CLEAR_MESSAGES, 
    ADD_OPENAI_NOTATION,
    ADD_REACT_NOTATION,
    SET_CONVERSATION_ID,
    SET_COMMUTE_ADDRESS,
    SET_CHAT_STATE, 
    SET_POI_ARR,
    SET_POI_DATA
 } from '../states/chatState';

const chatReducer = (state = initialChatState, action) => {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return {
        ...state,
        openAINotation: [...state.openAINotation, action.payload.userMessage, action.payload.assistantMessage],
        reactNotation: [...state.reactNotation, action.payload.userReactComponent, action.payload.assistantReactComponent]
      };
    case CLEAR_MESSAGES:
      return {
        ...state,
        openAINotation: [],
        reactNotation: [],
        conversationId: null
      }
    case ADD_OPENAI_NOTATION:
        return {
            ...state,
            openAINotation: [...state.openAINotation, action.payload]
        }
    case ADD_REACT_NOTATION:
        return {
            ...state,
            reactNotation: [...state.reactNotation, action.payload]
        }
    case SET_CONVERSATION_ID:
      return {
        ...state,
        conversationId: action.payload
      }
    case SET_COMMUTE_ADDRESS:
      return {
        ...state,
        commuteAddress: action.payload
      }
    case SET_CHAT_STATE:
      return {
        ...state,
        chatState: action.payload
      }
    case SET_POI_ARR:
      return {
        ...state,
        poiArr: action.payload
      }
    case SET_POI_DATA:
      return {
        ...state,
        poiData: action.payload
      }
    default:
      return state;
  }
};

export default chatReducer;
