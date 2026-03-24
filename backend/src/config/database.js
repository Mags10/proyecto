const mongoose = require('mongoose');

const connectDB = () => {
  const connectionString = process.env.MONGO_URI || 'mongodb://localhost:27017/monorepo';

  mongoose
    .connect(connectionString)
    .then(() => {
      console.log('Database connected');
    })
    .catch((err) => {
      console.log('Database connection error:');
      console.log(err);
    });
};

module.exports = connectDB;
