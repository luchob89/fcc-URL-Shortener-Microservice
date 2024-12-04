require('dotenv').config();
const bodyParser = require('body-parser');
const dns = require('dns');
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose  = require('mongoose');

mongoose.connect(process.env.MONGO_URI);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

/* db Code */
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});
const Url = mongoose.model('Url', urlSchema);

// Error handler middleware
app.post('/api/shorturl', function(req, res, next) {
  // Chequeamos que la url sea válida
  if ( !req.body.url.includes("http") || !req.body.url.includes("https") ) return res.json({ error: 'invalid url' });
  next();
})

// Guardado en db de nuevo url
app.post('/api/shorturl', async function(req, res, next) {

  // fx auxiliar para crear random integer
  function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const shortUrl = randomInteger(1, 50000);

  const newUrl = new Url({ 
    original_url: req.body.url,
    short_url: shortUrl 
  });
  // Guardamos el registro en la colección
  await newUrl.save();

  // Contestamos
  res.json({ 
    original_url: req.body.url, 
    short_url: shortUrl
  });

});

app.get('/api/shorturl/:shortUrlNumber', async (req, res) => {

  console.log(req.params)

  if ( !req.params.shortUrlNumber || !Number.isInteger(req.params.shortUrlNumber) ) return res.json({ error: 'invalid url' });

  const query = Url.where({ short_url: req.params.shortUrlNumber });
  const getUrl = await query.findOne();

  console.log(getUrl)

  if ( !getUrl ) return res.json({ error: 'invalid url' });

  // Redirigimos
  res.writeHead(301, {
    Location: getUrl.original_url
  }).end();

})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
