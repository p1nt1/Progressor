import { Router, Request, Response } from 'express';

const router = Router();

router.get('/session', (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;

