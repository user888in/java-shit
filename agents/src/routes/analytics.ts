import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = Router();
const analyticsController = new AnalyticsController();

// Prospect analytics
router.get('/prospect/:id', analyticsController.getProspectAnalytics.bind(analyticsController));

// Campaign analytics
router.get('/campaign/:id', analyticsController.getCampaignAnalytics.bind(analyticsController));

// Overview analytics
router.get('/overview', analyticsController.getOverviewAnalytics.bind(analyticsController));

// Top prospects
router.get('/top-prospects', analyticsController.getTopProspects.bind(analyticsController));

// Conversion funnel
router.get('/conversion-funnel', analyticsController.getConversionFunnel.bind(analyticsController));

export default router;