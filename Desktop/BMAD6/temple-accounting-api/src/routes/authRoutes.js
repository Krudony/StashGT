import { Hono } from 'hono';
import { register, login, logout } from '../controllers/authController.js';

const router = new Hono();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

export default router;
