import { Router } from 'express'
import { listOutreachLogs, runOutreach } from '../controllers/automations'

const router = Router()
router.get('/logs', listOutreachLogs)
router.post('/outreach', runOutreach)

export default router
