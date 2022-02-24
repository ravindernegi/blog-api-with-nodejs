require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 4000;
const { checkApiKey, checkAuth } = require('./src/helpers/common');
const errorHandler = require('./src/helpers/error_handler');
const AuthRoute = require('./src/routes/auth');
const UserRoute = require('./src/routes/user');
const PageRoute = require('./src/routes/page');

//allow cors
app.use(cors());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// parse requests of content-type - application/json
app.use(bodyParser.json());
// allow api code file
app.use(express.static('public'));

// define middleware for api key
//app.use(checkApiKey);
app.get('/test', (req, res) =>
  res.send({ status: true, data: 'Hello World!' })
);
// define auth route
app.use('/auth', AuthRoute);
// define user route
app.use('/users', UserRoute);
// define user route
app.use('/pages', PageRoute);
// global error handler
app.use(errorHandler);
// listen for requests
app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});
