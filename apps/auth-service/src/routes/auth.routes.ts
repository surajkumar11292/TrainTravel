import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router: Router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/oauth/google', AuthController.googleOAuth);

export default router;
