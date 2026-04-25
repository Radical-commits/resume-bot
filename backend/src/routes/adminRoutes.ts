import { Router } from 'express'
import { requireAdminToken, getAnalyticsSummary, getDbStatus, pruneDatabase } from '../controllers/adminController.js'

const router = Router()
router.use(requireAdminToken)
router.get('/analytics/summary', getAnalyticsSummary)
router.get('/db/status', getDbStatus)
router.post('/db/prune', pruneDatabase)
export default router
