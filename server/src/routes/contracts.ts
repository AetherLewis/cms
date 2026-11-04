import { Router } from 'express'
import * as contractController from '../controllers/contracts'

const router = Router()

router.get('/', contractController.listContracts)
router.post('/', contractController.createContract)
router.get('/:id', contractController.getContract)
router.put('/:id', contractController.updateContract)
router.delete('/:id', contractController.deleteContract)
router.get('/stats', contractController.getContractStats)

export default router