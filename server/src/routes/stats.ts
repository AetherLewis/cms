import { Router } from 'express'
import * as statsController from '../controllers/stats'

const router = Router()

router.get('/dashboard', statsController.getDashboardStats)
router.get('/monthly', statsController.getMonthlyReport)

export default router