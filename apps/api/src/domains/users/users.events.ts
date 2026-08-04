import { eventBus } from '../../shared/events/bus.js';
import { usersRepository } from './users.repository.js';

export function registerUsersEventListeners(): void {
  eventBus.subscribe('user.registered', async (payload) => {
    try {
      console.log(`👤 Event [user.registered]: Creating profile for user ${payload.userId}`);
      await usersRepository.upsertProfile(payload.userId, {
        defaultEmail: payload.email,
        defaultPhone: payload.phone,
      });
    } catch (err) {
      console.error(`❌ Failed to create profile for user ${payload.userId} on user.registered event:`, err);
    }
  });
}
