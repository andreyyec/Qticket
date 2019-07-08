import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from "react-router-dom";
// Redux
import { Provider } from 'react-redux';
import store from './store';
// Global Styles
import './styles/main.scss';
// Components
// Pages
import Home from './pages/home';
import ClientDetailed from "./pages/client-detailed";
import Master from "./master-template";

// TODO: Make color scheme for all app
const Qticket = () => {
  return (
    <Provider store={store}>
      <Router>
        <Master>
          <Route path="/" exact component={Home} />
          <Route path="/detalle-cliente" component={ClientDetailed} />
        </Master>
      </Router>
    </Provider>
  );
}

ReactDOM.render(<Qticket/>, document.getElementById('root'));
