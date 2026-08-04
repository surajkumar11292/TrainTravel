import { createRedisClient } from '../redis/client.js';
import { EventName, EventPayloads } from './types.js';

class EventBus {
  private publisher = createRedisClient();
  private subscriber = createRedisClient();
  private handlers = new Map<string, Array<(payload: any) => void | Promise<void>>>();
  private subscribedChannels = new Set<string>();

  constructor() {
    this.subscriber.on('message', (channel, message) => {
      const channelHandlers = this.handlers.get(channel);
      if (!channelHandlers || channelHandlers.length === 0) return;

      try {
        const payload = JSON.parse(message);
        for (const handler of channelHandlers) {
          Promise.resolve(handler(payload)).catch((err) => {
            console.error(`❌ Error in event handler for "${channel}":`, err);
          });
        }
      } catch (err) {
        console.error(`❌ Error parsing payload for event "${channel}":`, err);
      }
    });
  }

  async publish<K extends EventName>(event: K, payload: EventPayloads[K]): Promise<number> {
    const message = JSON.stringify(payload);
    return await this.publisher.publish(event, message);
  }

  async subscribe<K extends EventName>(
    event: K,
    handler: (payload: EventPayloads[K]) => void | Promise<void>
  ): Promise<void> {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);

    if (!this.subscribedChannels.has(event)) {
      await this.subscriber.subscribe(event);
      this.subscribedChannels.add(event);
    }
  }

  async disconnect(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}

export const eventBus = new EventBus();
