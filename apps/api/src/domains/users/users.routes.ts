import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authMiddleware } from '../../gateway/middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/me', (req, res, next) => usersController.getProfile(req, res, next));
router.patch('/me', (req, res, next) => usersController.updateProfile(req, res, next));

router.get('/passengers', (req, res, next) => usersController.getPassengers(req, res, next));
router.post('/passengers', (req, res, next) => usersController.createPassenger(req, res, next));
router.delete('/passengers/:id', (req, res, next) => usersController.deletePassenger(req, res, next));

export const usersRouter = router;
