// src/reducers/shareReducer.js
import { initialShareState, UPDATE_SHARES, SET_SHARE_HASH, SET_SHARE_EMAIL } from '../states/shareState';

const shareReducer = (state = initialShareState, action) => {
  switch (action.type) {
    case UPDATE_SHARES:
      return {
        ...state,
        shares: action.payload,
      };
    case SET_SHARE_HASH:
      return {
        ...state,
        hash: action.payload,
      };
    case SET_SHARE_EMAIL:
      return {
        ...state,
        email: action.payload,
      };
    default:
      return state;
  }
};

export default shareReducer;
