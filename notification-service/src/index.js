require('dotenv').config();
const express = require('express');
const emailConsumer = require('./kafka/consumer/email.consumer');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 4004;

app.use(express.json());

app.get('/', (req, res) => {
     res.send('Notification Service is running');
});

app.get('/health', (req, res) => {
     res.status(200).json({ status: 'ok', service: 'notification-service' });
});

const server = app.listen(PORT, () => {
     logger.info(`✅ Notification Service listening on port ${PORT}`);
     
     // Start Kafka consumer in background if broker is reachable
     emailConsumer.start().catch((err) => {
          logger.warn('Kafka consumer could not connect, running in standalone HTTP mode:', err.message);
     });
});

process.on('SIGTERM', () => {
     server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
     server.close(() => process.exit(0));
});