import { Router } from 'express'
import clients from './clients'
import contracts from './contracts'
import invoices from './invoices'
import payments from './payments'
import documents from './documents'
import audit from './audit'
import settings from './settings'
import recurring from './recurring'
import stats from './stats'

const router = Router()

router.use('/clients', clients)
router.use('/contracts', contracts)
router.use('/invoices', invoices)
router.use('/payments', payments)
router.use('/documents', documents)
router.use('/audit', audit)
router.use('/settings', settings)
router.use('/recurring', recurring)
router.use('/stats', stats)

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'StarCoreWeb' })
})

export default router