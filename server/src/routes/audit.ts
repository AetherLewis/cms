import { Router } from 'express'
import * as auditController from '../controllers/audit'

const router = Router()

router.get('/', auditController.listAuditLogs)
router.post('/', auditController.createAuditLog)

export default router