import { initialModelState, UPDATE_DESC_STATE, UPDATE_IMG_STATE } from '../states/modelState';

const modelReducer = (state = initialModelState, action) => {
    switch (action.type) {
        case UPDATE_DESC_STATE:
            return {
                ...state,
                payload: action.payload,
            };
        case UPDATE_IMG_STATE:
            return {
                ...state,
                payload: action.payload,
            };
        default:
            return state;
    }
};

export default modelReducer;
