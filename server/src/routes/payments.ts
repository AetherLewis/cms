import { Router } from 'express'
import * as paymentController from '../controllers/payments'

const router = Router()

router.get('/', paymentController.listPayments)
router.post('/', paymentController.createPayment)
router.get('/:id', paymentController.getPayment)
router.delete('/:id', paymentController.deletePayment)

export default router