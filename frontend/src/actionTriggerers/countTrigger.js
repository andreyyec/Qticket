import store from '../store';
import { addOne } from "../actions/action.counter";

export function triggerAddOutOfReactRedux() {
  console.log('Out react-redux action trigger');
  store.dispatch(addOne());
}
