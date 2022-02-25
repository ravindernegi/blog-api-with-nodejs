require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const app = express();
const port = process.env.PORT || 4000;
const { checkApiKey, checkAuth } = require('./src/helpers/common');
const errorHandler = require('./src/helpers/error_handler');
const AuthRoute = require('./src/routes/auth');
const UserRoute = require('./src/routes/user');
const PostRoute = require('./src/routes/post');

const apiBase = process.env.BASE_PATH || '/api/v1';

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

app.get(`${apiBase}/hello`, (req, res) =>
  res.send({ status: true, data: 'Hello World!' })
);

// define middleware for api key
app.use(checkApiKey);

// define auth route
app.use(`${apiBase}/auth`, AuthRoute);
// define user route
app.use(`${apiBase}/users`, UserRoute);
// define user route
app.use(`${apiBase}/posts`, PostRoute);
// global error handler
app.use(errorHandler);
// listen for requests
app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});
