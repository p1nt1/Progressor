import { Router, Request, Response } from 'express';
import * as templateService from './template.service';

const router = Router();

// List templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await templateService.getTemplates(req.user!.id);
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create / upsert template
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, exercises } = req.body;
    if (!name || !exercises) return res.status(400).json({ error: 'name and exercises are required' });
    const template = await templateService.createTemplate(req.user!.id, name, type || 'custom', exercises);
    res.status(201).json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// Delete template
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await templateService.deleteTemplate(req.user!.id, parseInt(req.params.id));
    if (!result) return res.status(404).json({ error: 'Template not found' });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;

