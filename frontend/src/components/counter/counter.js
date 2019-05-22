import React from 'react';
import { connect } from 'react-redux';
import { Button, Grid, Typography } from '@material-ui/core';
import { addOne, minusOne } from '../../actions/action.counter';
import { triggerAddOutOfReactRedux } from '../../actionTriggerers/countTrigger';

const Counter = ({addOne, minusOne, reducer1}) => {
  // In this component to Add One we're using an out-of-react-redux function
  return (
    <Grid container spacing={16}>
      <Grid item xs={10}>
        <Typography variant="body2" gutterBottom>
          {reducer1.count}
        </Typography>
        <Grid container spacing={16}>
          <Grid item>
            <Button onClick={triggerAddOutOfReactRedux} variant="contained" color="primary">Add one</Button>
          </Grid>
          <Grid item>
            <Button onClick={minusOne} variant="contained" color="secondary">Minus one</Button>
          </Grid>
        </Grid>
      </Grid>

    </Grid>
  );
}

const mapStateToProps = ({reducer1}) => ({reducer1})
const mapDispatchToProps = dispatch => ({
  addOne: () => dispatch(addOne()),
  minusOne: () => dispatch(minusOne())
})

export default connect(mapStateToProps, mapDispatchToProps)(Counter);
