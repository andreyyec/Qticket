import { createStore, applyMiddleware, combineReducers, compose } from "redux";
import { reducer1 } from './reducers/reducer1';
import promiseMiddleware from 'redux-promise';

const rootReducer = combineReducers({
  reducer1
});

const middleware = applyMiddleware(promiseMiddleware);
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(rootReducer, composeEnhancers(middleware));

export default store;


