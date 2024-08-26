import { initialFormDataState, UPDATE_FORMDATA_PAYLOAD } from '../states/formDataState';

const formDataReducer = (state = initialFormDataState, action) => {
  switch (action.type) {
    case UPDATE_FORMDATA_PAYLOAD:
      return {
        ...state,
        payload: action.payload,
      };
    default:
      return state;
  }
};

export default formDataReducer;
