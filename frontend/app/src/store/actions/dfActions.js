import { UPDATE_DF_PAYLOAD, UPDATE_DF_INDEX, UPDATE_COMPARING_INDICES } from '../states/dfState';

export const updateDFPayload = (df) => ({
  type: UPDATE_DF_PAYLOAD,
  payload: df,
});

export const updateDFIndex = (index) => ({
  type: UPDATE_DF_INDEX,
  payload: index,
});

export const updateComparingIndices = (indexArray) => ({
  type: UPDATE_COMPARING_INDICES,
  payload: indexArray
})