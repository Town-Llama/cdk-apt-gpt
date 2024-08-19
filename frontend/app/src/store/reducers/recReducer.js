// src/reducers/recReducer.js
import { initialRecState, UPDATE_RECS, SET_REC_HASH, SET_REC_EMAIL,
  SET_FORM_DATA
 } from '../states/recState';

const recReducer = (state = initialRecState, action) => {
  switch (action.type) {
    case UPDATE_RECS:
      return {
        ...state,
        recs: action.payload,
      };
    case SET_REC_HASH:
      return {
        ...state,
        hash: action.payload,
      };
    case SET_REC_EMAIL:
      return {
        ...state,
        email: action.payload,
      };
    case SET_FORM_DATA:
      return  {
        ...state,
        formData: action.payload
      }
    default:
      return state;
  }
};

export default recReducer;
