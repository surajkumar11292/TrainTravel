import { Router } from 'express';
import { authRouter } from '../domains/auth/auth.routes.js';
import { usersRouter } from '../domains/users/users.routes.js';
import { searchRouter } from '../domains/search/search.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/search', searchRouter);

export const gatewayRouter = router;
