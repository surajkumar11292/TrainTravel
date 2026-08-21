const { Kafka, logLevel } = require('kafkajs');
const logger = require('./logger');
const { config } = require('.');

// Kafka is optional — only connect if KAFKA_BROKER is explicitly configured
const KAFKA_ENABLED = !!config.KAFKA_BROKER;

let kafka, producer, consumer;

if (KAFKA_ENABLED) {
     kafka = new Kafka({
          clientId: config.KAFKA_CLIENT_ID || 'inventory-service',
          brokers: [config.KAFKA_BROKER],
          logLevel: logLevel.ERROR,
          retry: {
               initialRetryTime: 300,
               retries: 3,
               maxRetryTime: 10000,
          },
     });

     // Producer (for publishing SEAT_AVAILABILITY_UPDATED)
     producer = kafka.producer({
          allowAutoTopicCreation: true,
          transactionTimeout: 30000,
          idempotent: true,
          maxInFlightRequests: 5,
          retry: { retries: 3 },
     });

     // Consumer (for SCHEDULE_CREATED, SCHEDULE_CANCELLED)
     consumer = kafka.consumer({
          groupId: 'inventory-service-group',
          sessionTimeout: 30000,
          heartbeatInterval: 3000,
     });
} else {
     logger.warn('KAFKA_BROKER not set — Kafka disabled for inventory-service.');
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

const disconnectConsumer = async () => {
     if (!KAFKA_ENABLED || !consumer) return;
     await consumer.disconnect();
     logger.info('Kafka consumer disconnected');
};

const disconnectAll = async () => {
     await disconnectProducer();
     await disconnectConsumer();
};

module.exports = { kafka, producer, consumer, connectProducer, disconnectProducer, disconnectConsumer, disconnectAll, KAFKA_ENABLED };
