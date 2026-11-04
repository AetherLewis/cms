import { Router } from 'express'
import * as recurringController from '../controllers/recurring'

const router = Router()

router.get('/', recurringController.listRecurring)
router.post('/', recurringController.createRecurring)
router.put('/:id/toggle', recurringController.toggleRecurring)

export default router