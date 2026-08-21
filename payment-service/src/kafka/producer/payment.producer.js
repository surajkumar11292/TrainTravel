const { producer, connectProducer, KAFKA_ENABLED } = require('../../config/kafka');
const logger = require('../../config/logger');
const { KAFKA_TOPICS } = require('../../../../shared/constants/kafka-topics');

class PaymentProducer {
     constructor() { this.isInitialized = false; }

     async initialize() {
          if (!KAFKA_ENABLED || this.isInitialized) return;
          await connectProducer();
          this.isInitialized = true;
     }

     async sendMessage(topic, key, value) {
          if (!KAFKA_ENABLED) {
               logger.warn(`Kafka disabled — skipping publish to topic: ${topic}`, { key });
               return null;
          }
          try {
               await this.initialize();
               const result = await producer.send({
                    topic,
                    messages: [{
                         key: key || `${topic}-${Date.now()}`,
                         value: JSON.stringify(value),
                         timestamp: Date.now().toString(),
                    }],
               });
               logger.info(`Message sent to topic: ${topic}`, {
                    key,
                    partition: result[0].partition,
                    offset: result[0].offset,
               });
               return result;
          } catch (error) {
               logger.error(`Failed to send message to topic: ${topic}`, {
                    error: error.message,
                    key,
               });
               throw error;
          }
     }


     async publishPaymentSuccess(paymentOrderId, bookingId, gatewayPaymentId, amount) {
          return this.sendMessage(
               KAFKA_TOPICS.PAYMENT_SUCCESS,
               `payment-${paymentOrderId}`,
               {
                    paymentOrderId,
                    bookingId,
                    gatewayPaymentId,
                    amount,
                    capturedAt: new Date().toISOString(),
               }
          );
     }

     async publishPaymentFailed(paymentOrderId, bookingId, reason) {
          return this.sendMessage(
               KAFKA_TOPICS.PAYMENT_FAILED,
               `payment-${paymentOrderId}`,
               {
                    paymentOrderId,
                    bookingId,
                    reason,
                    failedAt: new Date().toISOString(),
               }
          );
     }
}

module.exports = new PaymentProducer();
