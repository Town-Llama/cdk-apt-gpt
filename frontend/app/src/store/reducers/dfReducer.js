// src/reducers/recReducer.js
import { initialDFState, UPDATE_DF_PAYLOAD,
   UPDATE_DF_INDEX, UPDATE_COMPARING_INDICES } from '../states/dfState';

const dfReducer = (state = initialDFState, action) => {
  switch (action.type) {
    case UPDATE_DF_PAYLOAD:
      return {
        ...state,
        payload: action.payload,
      };
    case UPDATE_DF_INDEX:
      return {
        ...state,
        index: action.payload
      }
    case UPDATE_COMPARING_INDICES:
      return {
        ...state,
        comparingIndices: action.payload
      }
    default:
      return state;
  }
};

export default dfReducer;
