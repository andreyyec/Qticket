import * as actions from '../actions/actions-consts';


export const reducer1 = (state = {count: 0}, action) => {
  switch (action.type) {
    case actions.COUNT_PLUS_1:
      return {
        ...state,
        count: (state.count + 1)
      }
    case actions.COUNT_MINUS_1:
      return {
        ...state,
        count: (state.count - 1)
      }
    default: return state;
  }
}
