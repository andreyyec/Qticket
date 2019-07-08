import React from 'react';
import { Grid, Paper } from "@material-ui/core";

const ClientDetailed = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={4}>
        <Paper>Hallo</Paper>
      </Grid>
      <Grid item xs={8}>
        <Paper>Client Detail</Paper>
      </Grid>
    </Grid>
  );
}

export default ClientDetailed;
