const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');

// Controllers
const controllers = require('./controllers/controllers');

const PORT = process.env.PORT || 8000;

const app = express();

app.use(express.json());

// jwt: https://harshitpant.com/blog/using-json-web-token-for-authentication
// Setting up bodyParser to use json and set it to req.body
app.use(bodyParser.json()); // jwt
app.use(bodyParser.urlencoded({ extended: true })); // jwt

// jwt middleware start...

// INstantiating the express-jwt middleware
const jwtMW = exjwt({
  secret: 'never use this simple secret in real life',
  algorithms: ['sha1', 'RS256', 'HS256'],
});

// jwt middleware end...

// jwt mockdata start...
// MOCKING DB just for test
const mockUsers = [
  {
    id: 1,
    username: 'bob',
    password: 'blackLodge',
  },
];
// jwt mockdata end...

// jwt routes start...

// LOGIN ROUTE
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Use your DB ORM logic here to find user and compare password
  /* Use your password hash checking logic here ! */
  const foundUser = mockUsers.filter((mock) => (mock.username === username && mock.password === password));

  if (foundUser.length > 0) {
    // If all credentials are correct do this
    const token = jwt.sign(
      { id: foundUser[0].id, username: foundUser[0].username },
      'never use this simple secret in real life',
      { expiresIn: 129600 },
    ); // Sigining the token
    res.json({
      success: true,
      err: null,
      token,
    });
  } else {
    return res.status(401).json({
      success: false,
      token: null,
      err: 'Username or password is incorrect',
    });
  }
  // }
});

// Test route for auth
app.get('/authtest', jwtMW /* Using the express jwt MW here */, (req, res) => {
  res.send('You are authenticated'); // Sending some response when authenticated
});

// Error handling
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    // Send the error rather than to show it on the console
    res.status(401).send(err);
  } else {
    next(err);
  }
});

/// jwt routes end...

app.get('/initdb', controllers.getInitDB);
app.get('/reservations', controllers.getReservations);
app.post('/reservation', controllers.postReservation);
app.delete('/reservation/:id', controllers.deleteReservation);
app.put('/reservation/:id', controllers.putReservation);
app.patch('/reservation/:id', controllers.patchReservation);

app.listen(PORT);
module.exports = app; // for mocha
