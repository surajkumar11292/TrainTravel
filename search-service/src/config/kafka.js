const { Kafka, logLevel } = require('kafkajs');
const logger = require('./logger');
const { config } = require('.');

// Kafka is optional — only connect if KAFKA_BROKER is explicitly configured
const KAFKA_ENABLED = !!config.KAFKA_BROKER;

let kafka, consumer, producer;

if (KAFKA_ENABLED) {
     kafka = new Kafka({
          clientId: config.KAFKA_CLIENT_ID || 'search-service',
          brokers: [config.KAFKA_BROKER],
          logLevel: logLevel.ERROR,
          retry: { initialRetryTime: 300, retries: 3, maxRetryTime: 10000 },
     });

     consumer = kafka.consumer({
          groupId: 'search-service-group-v2',
          sessionTimeout: 30000,
          heartbeatInterval: 3000,
     });

     // Producer (used only for DLQ publishing)
     producer = kafka.producer({
          allowAutoTopicCreation: true,
          retry: { retries: 3 },
     });
} else {
     logger.warn('KAFKA_BROKER not set — Kafka disabled for search-service.');
}

let isProducerConnected = false;

const connectProducer = async () => {
     if (!KAFKA_ENABLED || isProducerConnected) return;
     await producer.connect();
     isProducerConnected = true;
     logger.info('Kafka producer connected (DLQ)');
};

const disconnectAll = async () => {
     if (!KAFKA_ENABLED) return;
     if (consumer) await consumer.disconnect();
     if (isProducerConnected) {
          await producer.disconnect();
          isProducerConnected = false;
     }
     logger.info('Kafka consumer disconnected');
};

module.exports = { kafka, consumer, producer, connectProducer, disconnectAll, KAFKA_ENABLED };
