import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service';
import type { Tables } from '../types';

interface GetCompanyRequest {
  registrationNumber: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type CompanyData = Tables<'kyb_submissions'>;

export class CompanyController {
  static async getCompany(req: Request, res: Response): Promise<Response> {
    try {
      // Validate request body
      const validationError = CompanyController.validateGetCompanyRequest(req.body);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError
        } as ApiResponse<null>);
      }

      const { registrationNumber }: GetCompanyRequest = req.body;

      // Get company data from service
      const companyService = new CompanyService();
      const companyData = await companyService.getCompanyByRegistrationNumber(registrationNumber);


      
      return res.status(200).json({
        success: true,
        data: companyData
      } as ApiResponse<CompanyData>);

    } catch (error) {
      return CompanyController.handleError(error, res);
    }
  }

  private static validateGetCompanyRequest(body: any): string | null {
    if (!body) {
      return 'Request body is required';
    }

    if (!body.registrationNumber) {
      return 'Company registration number is required';
    }

    if (typeof body.registrationNumber !== 'string') {
      return 'Company registration number must be a string';
    }

    if (body.registrationNumber.trim().length === 0) {
      return 'Company registration number cannot be empty';
    }

    return null;
  }

  private static handleError(error: any, res: Response): Response {
    console.error('Controller error:', error);

    // Handle known service errors
    if (error.message === 'Company not found' || error.message === 'Database query failed') {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      } as ApiResponse<null>);
    }

    // Handle unexpected errors
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
}
