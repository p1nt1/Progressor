import type { Request, Response } from 'express';
import { Router } from 'express';
import * as templateService from './template.service';
import { asyncHandler, AppError } from '../../middleware/errors';
import { validateBody } from '../../middleware/validate';
import { createTemplateSchema } from './template.schemas';

const router = Router();

// List templates
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const templates = await templateService.getTemplates(req.user!.id);
    res.json(templates);
  }),
);

// Create / upsert template
router.post(
  '/',
  validateBody(createTemplateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, type, exercises } = req.body;
    const template = await templateService.createTemplate(req.user!.id, name, type, exercises);
    res.status(201).json(template);
  }),
);

// Delete template
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await templateService.deleteTemplate(req.user!.id, parseInt(req.params.id));
    if (!result) throw new AppError(404, 'Template not found');
    res.json({ deleted: true });
  }),
);

export default router;
