import { Hono } from 'hono';
import { honoVerifyToken } from '../middlewares/auth.js';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactionController.js';

const router = new Hono();

// Verify token for all routes
router.use('*', honoVerifyToken);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
