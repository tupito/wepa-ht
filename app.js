const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');

// Controllers
const controllers = require('./controllers/controllers');
const User = require('./models/user');

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
/*
const mockUsers = [
  {
    id: 1,
    username: 'bob',
    password: 'blackLodge',
  },
];
*/
// jwt mockdata end...

// jwt routes start...

// LOGIN ROUTE
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // Use your DB ORM logic here to find user and compare password
  /* Use your password hash checking logic here ! */
  // const foundUser = mockUsers.filter((mock) => (mock.username === username && mock.password === password));
  const foundUser = await User.findOne({
    where: {
      username, password,
    },
  });

  if (foundUser !== null) {
    // If all credentials are correct do this
    const token = jwt.sign(
      { id: foundUser.id, username: foundUser.username },
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

/// jwt routes end...

app.get('/initdb', jwtMW, controllers.getInitDB);
app.get('/reservations', jwtMW, controllers.getReservations);
app.post('/reservation', jwtMW, controllers.postReservation);
app.delete('/reservation/:id', jwtMW, controllers.deleteReservation);
app.put('/reservation/:id', jwtMW, controllers.putReservation);
app.patch('/reservation/:id', jwtMW, controllers.patchReservation);

// jwt Error handling
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    // Send the error rather than to show it on the console
    res.status(401).send(err);
  } else {
    next(err);
  }
});

app.listen(PORT);
module.exports = app; // for mocha
