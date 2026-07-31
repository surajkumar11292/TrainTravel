import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authGuard } from '../middleware/auth-guard';

const router: Router = Router();

router.use(authGuard);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

router.post('/passengers', UserController.addPassenger);
router.get('/passengers', UserController.getPassengers);
router.delete('/passengers/:id', UserController.deletePassenger);

export default router;
