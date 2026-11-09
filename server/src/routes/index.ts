import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import clients from './clients'
import contracts from './contracts'
import invoices from './invoices'
import payments from './payments'
import documents from './documents'
import audit from './audit'
import settings from './settings'
import recurring from './recurring'
import stats from './stats'
import automations from './automations'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'StarCoreWeb' })
})

router.use(authenticate)
router.use('/automations', automations)
router.use('/clients', clients)
router.use('/contracts', contracts)
router.use('/invoices', invoices)
router.use('/payments', payments)
router.use('/documents', documents)
router.use('/audit', audit)
router.use('/settings', settings)
router.use('/recurring', recurring)
router.use('/stats', stats)

export default router
