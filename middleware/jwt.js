const exjwt = require('express-jwt');

// INstantiating the express-jwt middleware
module.exports = exjwt({
  secret: 'never use this simple secret in real life',
  algorithms: ['sha1', 'RS256', 'HS256'],
});
