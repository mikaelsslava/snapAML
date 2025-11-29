import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';

const router = Router();

router.post('/company', CompanyController.getCompany);

export default router;
