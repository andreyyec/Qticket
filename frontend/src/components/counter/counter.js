import React from 'react';
import { connect } from 'react-redux';
import { addOne, minusOne } from '../../actions/action.counter';

const Counter = ({addOne, minusOne, reducer1}) => {

  return (
    <div>
      <p>{reducer1.count}</p>
      <button onClick={addOne}>Add one</button>
      <button onClick={minusOne}>Minus one</button>
    </div>
  );
}

const mapStateToProps = ({reducer1}) => ({reducer1})
const mapDispatchToProps = dispatch => ({
  addOne: () => dispatch(addOne()),
  minusOne: () => dispatch(minusOne())
})

export default connect(mapStateToProps, mapDispatchToProps)(Counter);
