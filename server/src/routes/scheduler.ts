import { Router } from 'express'
import { runScheduledWorkflows } from '../controllers/scheduler'

const router = Router()

// Invoked by deployment cron (for example every 5 minutes) with an `x-scheduler-key` header.
router.post('/run', runScheduledWorkflows)

export default router
