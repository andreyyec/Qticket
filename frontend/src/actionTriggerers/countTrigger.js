import store from '../store';
import { addOne } from "../actions/action.counter";

export function triggerAddOutOfReactRedux() {
  store.dispatch(addOne());
}
