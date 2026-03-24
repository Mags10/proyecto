const express = require('express');
const cors = require('cors');

const connectDB = require('./database');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;

    this.statusPath = '/api/status';

    this.middlewares();
    this.routes();
    connectDB();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  routes() {
    this.app.use(this.statusPath, require('../routes/status.route'));

    this.app.get('/', (req, res) => {
      res.json({
        message: 'Hello World!',
        timestamp: new Date()
      });
    });
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}`);
    });
  }
}

module.exports = Server;
