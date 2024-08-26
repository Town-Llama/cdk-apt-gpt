import { UPDATE_FORMDATA_PAYLOAD } from '../states/formDataState';

export const updateFormDataPayload = (formData) => ({
  type: UPDATE_FORMDATA_PAYLOAD,
  payload: formData,
});
