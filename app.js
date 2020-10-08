const express = require('express');

// Controllers
const controllers = require('./controllers/controllers');

const PORT = process.env.PORT || 8000;

const app = express();

app.use(express.json());

app.get('/initdb', controllers.getInitDB);
app.get('/reservations', controllers.getReservations);
app.post('/reservation', controllers.postReservation);
app.delete('/reservation/:id', controllers.deleteReservation);
app.put('/reservation/:id', controllers.putReservation);
app.patch('/reservation/:id', controllers.patchReservation);

app.listen(PORT);
module.exports = app; // for mocha
