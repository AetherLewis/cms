import { Router } from 'express'
import * as invoiceController from '../controllers/invoices'

const router = Router()

router.get('/', invoiceController.listInvoices)
router.post('/', invoiceController.createInvoice)
router.get('/:id', invoiceController.getInvoice)
router.put('/:id', invoiceController.updateInvoice)
router.delete('/:id', invoiceController.deleteInvoice)

export default router