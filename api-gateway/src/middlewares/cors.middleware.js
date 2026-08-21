const cors = require('cors');
const { config } = require('../config');

const allowedOrigins = config.ALLOWED_ORIGINS
     ? config.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, ''))
     : [];

const corsMiddleware = cors({
     origin: function (origin, callback) {
          if (!origin) return callback(null, true);
          const cleanOrigin = origin.replace(/\/$/, '');

          if (allowedOrigins.includes('*') || allowedOrigins.includes(cleanOrigin) || allowedOrigins.some(ao => cleanOrigin.startsWith(ao))) {
               callback(null, true);
          } else {
               callback(new Error(`Not allowed by CORS: ${origin}`));
          }
     },
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization'],
});

module.exports = { corsMiddleware };
