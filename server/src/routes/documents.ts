import { Router } from 'express'
import * as docController from '../controllers/documents'

const router = Router()

router.get('/', docController.listDocuments)
router.post('/', docController.createDocument)
router.get('/:id', docController.getDocument)
router.delete('/:id', docController.deleteDocument)
router.get('/:id/export', docController.exportDocument)

export default router
