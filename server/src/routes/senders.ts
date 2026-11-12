import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as sendersController from '../controllers/senders'

const router = Router()

// Provider callback is reached by a browser redirect (no bearer token); the signed state carries the user.
router.get('/oauth/:provider/callback', sendersController.oauthCallback)

router.use(authenticate)
router.get('/', sendersController.listSendersHandler)
router.post('/authorize', sendersController.startAuthorization)
router.patch('/:id', sendersController.renameSenderHandler)
router.post('/:id/disconnect', sendersController.disconnectSenderHandler)

export default router
