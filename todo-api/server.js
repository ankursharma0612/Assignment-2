require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const { PORT = 5000, MONGO_URI } = process.env;

if (!MONGO_URI) {
  console.error('Missing MONGO_URI. Create a .env file (see .env.example).');
  process.exit(1);
}

// Start listening only after the database connection succeeds.
connectDB(MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
});
