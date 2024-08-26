import { UPDATE_DESC_STATE, UPDATE_IMG_STATE } from '../states/modelState';

export const updateDescState = (state) => ({
    type: UPDATE_DESC_STATE,
    payload: state,
});

export const updateImgState = (state) => ({
    type: UPDATE_IMG_STATE,
    payload: state,
});
