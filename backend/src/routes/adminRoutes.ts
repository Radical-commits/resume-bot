import { Router } from 'express'
import { getAnalyticsSummary } from '../controllers/adminController.js'

const router = Router()
router.get('/analytics/summary', getAnalyticsSummary)
export default router
