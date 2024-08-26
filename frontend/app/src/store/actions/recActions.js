import { UPDATE_RECS, SET_REC_HASH, SET_REC_EMAIL, SET_FORM_DATA } from '../states/recState';

export const updateRecs = (recs) => ({
  type: UPDATE_RECS,
  payload: recs,
});

export const setRecHash = (hash) => ({
  type: SET_REC_HASH,
  payload: hash,
});

export const setRecEmail = (email) => ({
  type: SET_REC_EMAIL,
  payload: email,
});

export const setFormData = (data) => ({
  type: SET_FORM_DATA,
  payload: data,
});

