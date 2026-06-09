import { Router } from 'express';
import { CampaignController } from '../controllers/CampaignController';

const router = Router();
const campaignController = new CampaignController();

// Campaign management
router.post('/', campaignController.createCampaign.bind(campaignController));
router.put('/:id/start', campaignController.startCampaign.bind(campaignController));
router.put('/:id/pause', campaignController.pauseCampaign.bind(campaignController));
router.put('/:id/complete', campaignController.completeCampaign.bind(campaignController));
router.put('/:id/cancel', campaignController.cancelCampaign.bind(campaignController));
router.get('/:id', campaignController.getCampaignDetails.bind(campaignController));
router.get('/:id/analytics', campaignController.getCampaignAnalytics.bind(campaignController));

// Outreach sending
router.post('/:id/outreach', campaignController.sendOutreach.bind(campaignController));

// Inbound response processing
router.post('/inbound', campaignController.processInbound.bind(campaignController));

export default router;