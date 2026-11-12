import { Router } from 'express'
import * as workflowsController from '../controllers/workflows'

const router = Router()

router.get('/', workflowsController.listWorkflows)
router.get('/readiness', workflowsController.getWorkflowReadiness)
router.post('/', workflowsController.createWorkflow)
router.post('/preview', workflowsController.previewWorkflowHandler)
router.post('/:id/preview', workflowsController.previewWorkflowHandler)
router.get('/:id', workflowsController.getWorkflow)
router.put('/:id', workflowsController.updateWorkflow)
router.post('/:id/activate', workflowsController.activateWorkflow)
router.post('/:id/pause', workflowsController.pauseWorkflow)
router.post('/:id/run', workflowsController.runWorkflowNow)
router.get('/:id/runs', workflowsController.listWorkflowRuns)
router.delete('/:id', workflowsController.deleteWorkflow)

export default router
