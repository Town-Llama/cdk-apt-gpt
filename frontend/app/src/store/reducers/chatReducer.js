// src/reducers/recReducer.js
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

const chatReducer = (state = initialChatState, action) => {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return {
        ...state,
        openAINotation: [...state.openAINotation, action.payload.userMessage, action.payload.assistantMessage],
        reactNotation: [...state.reactNotation, action.payload.userReactComponent, action.payload.assistantReactComponent]
      };
    case UPDATE_COMPARING_INDICES:
      return {
        ...state,
        comparingIndices: action.payload
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
    case SET_DF:
      return {
        ...state,
        df: action.payload
      }
    case SET_CHAT_STATE:
      return {
        ...state,
        chatState: action.payload
      }
    case UPDATE_QUERY:
      return {
        ...state,
        query: action.payload
      }
    default:
      return state;
  }
};

export default chatReducer;
