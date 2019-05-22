import { COUNT_PLUS_1, COUNT_MINUS_1 } from './actions-consts';

export const addOne = () => {
  return {
    type: COUNT_PLUS_1,
    payload: null
  }
}

export const minusOne = () => {
  return {
    type: COUNT_MINUS_1,
    payload: null
  }
}
