import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
// Redux
import { Provider } from 'react-redux';
import store from './store';
// Global Styles
import './styles/main.scss';
// Components
import {AppBar, Button, Toolbar} from "@material-ui/core";
// Pages
import Home from './pages/home';
import Page2 from "./pages/page2";


const Qticket = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppBar color="default" position="sticky">
          <Toolbar>
            <Button component={Link} to="/">Home</Button>
            <Button component={Link} to="/page-2">Page-2</Button>
          </Toolbar>
        </AppBar>
        <Route path="/" exact component={Home}></Route>
        <Route path="/page-2" component={Page2}></Route>
      </Router>
    </Provider>
  );
}

ReactDOM.render(<Qticket/>, document.getElementById('root'));
