import { UPDATE_SHARES, SET_SHARE_HASH, SET_SHARE_EMAIL } from '../states/shareState';

export const updateShares = (shares) => ({
  type: UPDATE_SHARES,
  payload: shares,
});

export const setShareHash = (hash) => ({
  type: SET_SHARE_HASH,
  payload: hash,
});

export const setShareEmail = (email) => ({
  type: SET_SHARE_EMAIL,
  payload: email,
});

