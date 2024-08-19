import { initialPastState, UPDATE_PAST_STATE } from '../states/pastState';

const pastReducer = (state = initialPastState, action) => {
  switch (action.type) {
    case UPDATE_PAST_STATE:
      return {
        ...state,
        pastState: action.payload,
      };
    default:
      return state;
  }
};

export default pastReducer;
