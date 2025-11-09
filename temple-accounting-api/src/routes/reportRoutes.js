import { Hono } from 'hono';
import { honoVerifyToken } from '../middlewares/auth.js';
import {
  getSummary,
  getDetailedReport,
  exportPDF,
  exportExcel
} from '../controllers/reportController.js';

const router = new Hono();

// Verify token for all routes
router.use('*', honoVerifyToken);

router.get('/summary', getSummary);
router.get('/detailed', getDetailedReport);
router.get('/export-pdf', exportPDF);
router.get('/export-excel', exportExcel);

export default router;
