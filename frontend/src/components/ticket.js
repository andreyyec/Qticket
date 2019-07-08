import React, {useState} from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Link,
  Typography,
  Paper
} from "@material-ui/core";
import Alert from './alert';
import { Link as RouterLink } from 'react-router-dom';

const Ticket = ({disabled}) => {
  const [showEditingAlert, setShowEditingAlert] = useState(false);

  function closeEditingAlert () {
    setShowEditingAlert(false);
  }

  return (
    <Grid item className={`ticket ${disabled && 'ticket--disabled'}`}>
      <Card className="ticket__card">
        <Link
          underline="none"
          component={disabled ? 'a' : RouterLink}
          to={disabled ? '#' : "/detalle-cliente"}
          onClick={disabled ? () => setShowEditingAlert(true) : null}
        >
          <CardActionArea className="ticket__actionArea">
            <Paper className="ticket__numberContainer">
              <Typography variant="h4" paragraph className="ticket__numberText">33</Typography>
            </Paper>
            <CardContent className="ticket__content">
              <Typography paragraph variant="overline" className="ticket__customerName">John Smith Pérez</Typography>
              <Typography variant="caption" className="ticket__editingMessage">Alguien más está editando...</Typography>
            </CardContent>
          </CardActionArea>
        </Link>
      </Card>
      <Alert showSnack={showEditingAlert} handleClose={closeEditingAlert} variant="red">
        Esta ficha esta siendo editada por Dimitri Ivanov Jiménez
      </Alert>
    </Grid>
  );
};

export default Ticket;
