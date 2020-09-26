const { json } = require('express');
const express = require('express');

const PORT = process.env.PORT || 8080;

const app = express();

let debugTesteri = 0;
    debugTesteri += 1;
        debugTesteri += 2;
console.log(debugTesteri);

app.get('/test', (req, res, next) => {
  console.log('GET /TEST postman');
  const jsonrest = { name: 'Tomi' };
  res.send(jsonrest);
});

app.listen(PORT);
