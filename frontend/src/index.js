import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import { Provider } from 'react-redux';
import store from './store';
import './styles/main.scss';

// Pages
import Home from './pages/home';
import Page2 from "./pages/page2";


const Qticket = () => {
  return (
    <Provider store={store}>
      <Router>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/page-2">Page 2</Link>
        </nav>
        <Route path="/" exact component={Home}></Route>
        <Route path="/page-2" component={Page2}></Route>
      </Router>
    </Provider>
  );
}

ReactDOM.render(<Qticket/>, document.getElementById('root'));
