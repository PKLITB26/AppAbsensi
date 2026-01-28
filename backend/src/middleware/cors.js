const cors = require('cors');

const corsOptions = {
  origin: ['http://localhost:8081', 'http://192.168.1.100:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
  maxAge: 3600
};

module.exports = cors(corsOptions);