import React from 'react';
import Counter from "../components/counter/counter";
import {Typography} from "@material-ui/core";

const Home = () => {
  return (
    <div>
      <Typography variant="h3" gutterBottom>Home: Andy es un vegetal</Typography>
      <Counter/>
    </div>
  );
}

export default Home;
