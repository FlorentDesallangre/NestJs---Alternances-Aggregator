import { Injectable } from '@nestjs/common';
import { AuthBody, CreateUser } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  async login({ authBody }: { authBody: AuthBody }) {
    const { email, password } = authBody;
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!existingUser) {
      throw new Error('L&apos;utilisateur n&apos;éxiste pas');
    }
    const isPasswordValid = await this.isPasswordValid({
      password,
      hashedPassword: existingUser.password,
    });
    if (!isPasswordValid) {
      throw new Error('Le mot de passe est incorrect');
    }
    return await this.authenticateUser({ userId: existingUser.id.toString() });
  }

  async register({ registerBody }: { registerBody: CreateUser }) {
    const { email, firstName, password } = registerBody;
    const hashedPassword = await this.hashPassword({ password });

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existingUser) {
      throw new Error('l&apos;utilisateur existe déja');
    }
    const CreatedUser = await this.prisma.user.create({
      data: {
        email,
        firstName,
        password: hashedPassword,
      },
    });
    return await this.authenticateUser({ userId: CreatedUser.id.toString() });
  }

  private async hashPassword({ password }: { password: string }) {
    const hashedPassword = await hash(password, 10);
    return hashedPassword;
  }

  private async isPasswordValid({
    password,
    hashedPassword,
  }: {
    password: string;
    hashedPassword: string;
  }) {
    const isPasswordValid = await compare(password, hashedPassword);
    return isPasswordValid;
  }
  private authenticateUser({ userId }: UserPayload) {
    const payload: UserPayload = { userId };
    return { access_token: this.jwtService.sign(payload) };
  }

  async fetchFranceTravailAccessToken(): Promise<{
    FranceTravailAccessToken: string;
  }> {
    const url =
      'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const clientId = process.env.API_CLIENT_ID;
    const clientSecret = process.env.API_SECRET;
    const scopes = 'api_offresdemploiv2 o2dsoffre';

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: scopes,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error(
          `Erreur lors de la récupération du token France Travail: ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (data && data.access_token) {
        return { FranceTravailAccessToken: data.access_token };
      } else {
        throw new Error('Access token France Travail non trouvé');
      }
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération du token: ${error.message}`,
      );
    }
  }
}
