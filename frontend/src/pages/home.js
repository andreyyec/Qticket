import React from 'react';
import Ticket from "../components/ticket";
import { Grid } from '@material-ui/core';

const Home = () => {
  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <Grid container justify="center" spacing={2}>
          <Ticket disabled/>
          <Ticket/>
          <Ticket/>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default Home;
