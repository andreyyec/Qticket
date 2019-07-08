import React, { Fragment, useState } from 'react';
import { Typography, AppBar, Toolbar, IconButton, Drawer } from "@material-ui/core";
import MenuIcon from '@material-ui/icons/Menu';

const Master = ({children}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <Fragment>
      {/* TODO: Make navbar white*/}
      <AppBar position="fixed" color="default">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="Menu" onClick={() => setIsDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">
            QTicket
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        Menu
      </Drawer>
      {children}
    </Fragment>
  );
}


export default Master;
