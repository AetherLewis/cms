import { Router } from 'express'
import * as clientController from '../controllers/clients'

const router = Router()

router.get('/', clientController.listClients)
router.post('/', clientController.createClient)
router.get('/:id', clientController.getClient)
router.put('/:id', clientController.updateClient)
router.delete('/:id', clientController.deleteClient)

export default router