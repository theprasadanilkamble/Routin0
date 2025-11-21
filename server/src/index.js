require('dotenv').config();

const { createApp } = require('./app');
const { connectDb } = require('./config/database');

const PORT = process.env.PORT || 5000;
const app = createApp();

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start API', error);
    process.exit(1);
  });


