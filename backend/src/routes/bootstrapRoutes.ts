import express from 'express'
import { getBootstrap } from '../controllers/bootstrapController.js'

const router = express.Router()

router.get('/', getBootstrap)

export default router
