const express = require('express');
const bodyParser = require('body-parser');

// Controllers
const controllers = require('./controllers/controllers');

const PORT = process.env.PORT || 8000;
const app = express();

app.use(express.json());

// jwt
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const jwt = require('./middleware/jwt');

// routes
app.post('/login', controllers.login);
app.get('/authtest', jwt, (req, res) => { res.send('You are authenticated'); });
app.get('/initdb', controllers.getInitDB);
app.get('/reservations', jwt, controllers.getReservations);
app.post('/reservation', jwt, controllers.postReservation);
app.delete('/reservation/:id', jwt, controllers.deleteReservation);
app.put('/reservation/:id', jwt, controllers.putReservation);
app.patch('/reservation/:id', jwt, controllers.patchReservation);

// jwt Error handling
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send(err);
  } else {
    next(err);
  }
});

app.listen(PORT);
module.exports = app; // for mocha
