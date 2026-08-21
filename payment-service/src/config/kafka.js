const { Kafka, logLevel } = require('kafkajs');
const logger = require('./logger');
const { config } = require('.');

// Kafka is optional — only connect if KAFKA_BROKER is explicitly configured
const KAFKA_ENABLED = !!config.KAFKA_BROKER;

let kafka, producer;

if (KAFKA_ENABLED) {
     kafka = new Kafka({
          clientId: config.KAFKA_CLIENT_ID || 'payment-service',
          brokers: [config.KAFKA_BROKER],
          logLevel: logLevel.ERROR,
          retry: {
               initialRetryTime: 300,
               retries: 3,
               maxRetryTime: 10000,
          },
     });

     // Producer only (payment-service publishes PAYMENT_SUCCESS / PAYMENT_FAILED)
     producer = kafka.producer({
          allowAutoTopicCreation: true,
          transactionTimeout: 30000,
          idempotent: true,
          maxInFlightRequests: 5,
          retry: { retries: 3 },
     });
} else {
     logger.warn('KAFKA_BROKER not set — Kafka disabled for payment-service.');
}

let isProducerConnected = false;

const connectProducer = async () => {
     if (!KAFKA_ENABLED || isProducerConnected) return;
     await producer.connect();
     isProducerConnected = true;
     logger.info('Kafka producer connected');
};

const disconnectProducer = async () => {
     if (!KAFKA_ENABLED || !isProducerConnected) return;
     await producer.disconnect();
     isProducerConnected = false;
     logger.info('Kafka producer disconnected');
};

module.exports = { kafka, producer, connectProducer, disconnectProducer, KAFKA_ENABLED };
