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

// CORS Middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    process.env.CLIENT_BASE_URL,
    'http://localhost:3000' // Add your frontend URL
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Handle OPTIONS requests explicitly
app.options('*', (req, res) => {
  res.sendStatus(204); // No content
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Include routes
const apiRouter = require('./routes');
app.use('/api', apiRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// In server.js, modify the printRoutes function:
function printRoutes() {
  console.log('\nRegistered Routes:');
  app._router.stack.forEach((middleware) => {
    if (middleware.name === 'router') {
      const path = middleware.regexp.toString()
        .replace('/^\\', '')
        .replace('\\/?$/', '')
        .replace('(?=\\/|$)/i', '');
      
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).join(', ');
          console.log(`${methods} -> ${path}${handler.route.path}`);
        }
      });
    }
  });
}

console.log(figlet.textSync('homehost'));
printRoutes();

app.listen(port, () => console.log(`Listening on port ${port}`));