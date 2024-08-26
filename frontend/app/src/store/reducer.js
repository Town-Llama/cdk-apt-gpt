import { combineReducers } from 'redux';
import recReducer from './reducers/recReducer';
import shareReducer from './reducers/shareReducer';
import dfReducer from './reducers/dfReducer';
import formDataReducer from "./reducers/formDataReducer";
import pastReducer from './reducers/pastReducer';
import chatReducer from './reducers/chatReducer';
import modelReducer from './reducers/modelReducer';

const rootReducer = combineReducers({
  df: dfReducer,
  chat: chatReducer,
  rec: recReducer,
  share: shareReducer,
  formData: formDataReducer,
  past: pastReducer,
  model: modelReducer
  // other reducers can be added here
});

export default rootReducer;
