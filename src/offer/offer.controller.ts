import { Controller, Get } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { OfferService } from './offer.service';

@Controller('offer')
export class OfferController {
  constructor(
    private readonly offerService: OfferService,
    private readonly authService: AuthService,
  ) {}

  @Get('france-travail-token')
  async getFranceTravailToken(): Promise<{ franceTravailToken: string }> {
    const { FranceTravailAccessToken: token } =
      await this.authService.fetchFranceTravailAccessToken();
    return { franceTravailToken: token };
  }

  @Get('jobs')
  async getJobOffers(): Promise<any> {
    return this.offerService.getJobOffers();
  }
}
