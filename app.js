const { json } = require('express');
const express = require('express');

const PORT = process.env.PORT || 8000;

const app = express();

let debugTesteri = 0;
debugTesteri += 1;
debugTesteri += 2;
console.log(debugTesteri);

app.get('/test', (req, res, next) => {
  console.log('GET /test wepa-ht');
  const jsonrest = { message: 'weba-ht' };
  res.send(jsonrest);
});

app.listen(PORT);
