import { Router } from 'express'
import {
  requireAdminToken,
  getAnalyticsSummary,
  getDbStatus,
  pruneDatabase,
  getExchanges,
  getInsights,
  refreshInsights,
} from '../controllers/adminController.js'

const router = Router()
router.use(requireAdminToken)
router.get('/analytics/summary', getAnalyticsSummary)
router.get('/analytics/exchanges', getExchanges)
router.get('/analytics/insights', getInsights)
router.post('/analytics/insights/refresh', refreshInsights)
router.get('/db/status', getDbStatus)
router.post('/db/prune', pruneDatabase)
export default router
