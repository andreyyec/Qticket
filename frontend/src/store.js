import { createStore, applyMiddleware, combineReducers, compose } from "redux";
import { reducer1 } from './reducers/reducer1';
import promiseMiddleware from 'redux-promise';

const rootReducer = combineReducers({
  reducer1
});

const enhancers = compose(
  applyMiddleware(promiseMiddleware),
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)

const store = createStore(rootReducer, enhancers);

export default store;
