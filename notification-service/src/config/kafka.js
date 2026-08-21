const { Kafka, logLevel } = require('kafkajs');
const logger = require('./logger');
const { config } = require('.');

// Kafka is optional — only connect if KAFKA_BROKER is explicitly configured
const KAFKA_ENABLED = !!config.KAFKA_BROKER;

let kafka, consumer, producer;

if (KAFKA_ENABLED) {
     kafka = new Kafka({
          clientId: config.KAFKA_CLIENT_ID || 'notification-service',
          brokers: [config.KAFKA_BROKER],
          logLevel: logLevel.ERROR,
          retry: {
               initialRetryTime: 300,
               retries: 3,
               maxRetryTime: 10000,
               multiplier: 2,
          },
     });

     consumer = kafka.consumer({
          groupId: 'notification-service-group',
          sessionTimeout: 30000,
          heartbeatInterval: 3000,
     });

     // Producer (used only for DLQ publishing)
     producer = kafka.producer({
          allowAutoTopicCreation: true,
          retry: { retries: 3 },
     });
} else {
     logger.warn('KAFKA_BROKER not set — Kafka disabled for notification-service.');
}

let isProducerConnected = false;

const connectProducer = async () => {
     if (!KAFKA_ENABLED || isProducerConnected) return;
     await producer.connect();
     isProducerConnected = true;
     logger.info('Kafka producer connected (DLQ)');
};

// Graceful shutdown
const shutdown = async () => {
     logger.info('Shutting down Kafka connections...');
     if (KAFKA_ENABLED && consumer) await consumer.disconnect();
     if (isProducerConnected) {
          await producer.disconnect();
          isProducerConnected = false;
     }
     process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { kafka, consumer, producer, connectProducer, KAFKA_ENABLED };
