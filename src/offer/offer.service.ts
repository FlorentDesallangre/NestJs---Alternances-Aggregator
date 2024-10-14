import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service'; // Pour récupérer le token

@Injectable()
export class OfferService {
  constructor(private readonly authService: AuthService) {}

  async getJobOffers(): Promise<any> {
    const franceTravailToken =
      await this.authService.fetchFranceTravailAccessToken();

    const params = new URLSearchParams({
      motsCles: 'Développeur',
      typeContrat: 'alternance',
    });

    const url = `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${franceTravailToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors de la récupération des offres: ${response.statusText}`,
      );
    }

    const jobOffers = await response.json();

    const filteredOffers = jobOffers.filter((offer) => {
      return !offer.entrepriseNom.includes('ISCOD');
    });

    return filteredOffers;
  }
}
