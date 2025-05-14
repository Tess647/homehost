const path = require('path');
const express = require('express');

const figlet = require('figlet');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

require('dotenv').config();
require('./jobs').fileWatcher();

const app = express();
const port = process.env.PORT || 5000;

// Middleware Setup (ORDER MATTERS!)
app.use(bodyParser.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies


// CORS
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_BASE_URL || '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true'); // Required for cookies
  next();
});

// Handle OPTIONS requests explicitly
app.options('*', (req, res) => {
  console.log('OPTIONS preflight received');
  res.sendStatus(204); // No content
});

// app.options('*', (req, res) => res.sendStatus(200));

// Include routes
app.use('/api', require('./routes'));

// Serve the static files from the React app
if (process.env.NODE_ENV == 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

console.log(figlet.textSync('homehost'));
app.listen(port, () => console.log(`Listening on port ${port}`));
