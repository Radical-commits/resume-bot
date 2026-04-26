import { Router } from 'express'
import { handleAnalyticsEvent } from '../controllers/analyticsController.js'

const router = Router()
router.post('/event', handleAnalyticsEvent)
export default router
