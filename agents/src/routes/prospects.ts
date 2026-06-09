import { Router } from 'express';
import { ProspectController } from '../controllers/ProspectController';

const router = Router();
const prospectController = new ProspectController();

// Get all prospects with filtering options
router.get('/', prospectController.findAll.bind(prospectController));

// Get a specific prospect
router.get('/:id', prospectController.findOne.bind(prospectController));

// Create a new prospect
router.post('/', prospectController.create.bind(prospectController));

// Update a prospect
router.put('/:id', prospectController.update.bind(prospectController));

// Delete a prospect
router.delete('/:id', prospectController.remove.bind(prospectController));

// Enrich prospect data with intelligence
router.get('/:id/enrich', prospectController.enrich.bind(prospectController));

// Search prospects by criteria
router.post('/search', prospectController.searchByCriteria.bind(prospectController));

export default router;