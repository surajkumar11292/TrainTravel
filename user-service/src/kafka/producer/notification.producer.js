const { producer, connectProducer, KAFKA_ENABLED } = require('../../config/kafka');
const logger = require('../../config/logger');
const { KAFKA_TOPICS } = require('../../../../shared/constants/kafka-topics');

class NotificationProducer {
     constructor() {
          this.isInitialized = false;
     }

     async initialize() {
          if (!KAFKA_ENABLED || this.isInitialized) return;
          await connectProducer();
          this.isInitialized = true;
     }


     async sendMessage(topic, key, value){
          // If Kafka is not configured, skip silently (don't crash the request)
          if (!KAFKA_ENABLED) {
               logger.warn(`Kafka disabled — skipping message to topic: ${topic}`, { key });
               return null;
          }
          try{
               await this.initialize();

               const message = {
                    topic,
                    messages: [{
                         key: key || `${topic}-${Date.now()}`,
                         value: JSON.stringify(value),
                         timeStamp: Date.now().toString()
                    }]
               }

               const result = await producer.send(message);
               logger.info(`Message sent to kafka topic: ${topic}`, {
                    key,
                    partition: result[0].partition,
                    offset: result[0].offset,
               });
               
               return result;
          }catch(error){
               logger.error(`Failed to send message to kafka topic: ${topic}`, {
                    error: error.message,
                    stack: error.stack,
                    key
               })
               throw error;
          }
     }
     async sendOtpEmail(email, otp, ttlMinutes = 5){
          return this.sendMessage(
               KAFKA_TOPICS.OTP_EMAIL,
               `otp-${email}`,
               {email, otp, ttlMinutes}
          )
     }

     async sendWelcomeEmail(email, firstName){
          return this.sendMessage(
               KAFKA_TOPICS.WELCOME_EMAIL,
               `welcome-${email}`,
               {email, firstName}
          )
     }
}

module.exports = new NotificationProducer();