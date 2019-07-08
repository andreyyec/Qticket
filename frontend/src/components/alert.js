import { IconButton, Portal, Snackbar, SnackbarContent } from "@material-ui/core";
import { Close as CloseIcon } from "@material-ui/icons";
import React from "react";

function Alert ({showSnack, handleClose, variant, children}) {
  return (
    <Portal container={document.querySelector('#snackbars')}>
      <Snackbar
        anchorOrigin={{vertical: 'top', horizontal: 'center'}}
        open={showSnack}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <SnackbarContent
          className={`alert ${variant && `alert--${variant}`}`}
          message={children}
          action={[
            <IconButton key="close" aria-label="Close" color="inherit" onClick={handleClose}>
              <CloseIcon />
            </IconButton>,
          ]}
        />
      </Snackbar>
    </Portal>
  );
}

export default Alert;
