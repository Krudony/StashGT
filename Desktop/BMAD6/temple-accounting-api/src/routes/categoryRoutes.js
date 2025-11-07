import { Hono } from 'hono';
import { honoVerifyToken } from '../middlewares/auth.js';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';

const router = new Hono();

// Verify token for all routes
router.use('*', honoVerifyToken);

router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
