require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./db.js');
const fileUpload = require('express-fileupload');
require('./models/models.js');

const app = express();
const PORT = process.env.PORT || 4444;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(fileUpload({}));

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log('server started on port:' + PORT);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
