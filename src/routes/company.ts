import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';

const router = Router();

router.post('/company', CompanyController.getCompany);
router.get('/company', (req, res) => {res.status(200).send('Company API is running');});

export default router;
