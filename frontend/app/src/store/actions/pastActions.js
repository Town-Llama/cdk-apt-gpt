import { UPDATE_PAST_STATE } from '../states/pastState';

export const updatePastState = (past) => ({
  type: UPDATE_PAST_STATE,
  payload: past,
});
