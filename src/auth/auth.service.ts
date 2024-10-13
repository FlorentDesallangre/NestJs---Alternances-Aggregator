import { Injectable } from '@nestjs/common';
import { AuthBody, CreateUser } from './auth.controller';
import { PrismaService } from 'src/prisma.service';
import { hash, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UserPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  async login({ authBody }: { authBody: AuthBody }) {
    const { email, password } = authBody;
    // const hashPassword = await this.hashPassword({ password });
    // console.log(hashPassword);
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
  //     const hashPassword = await this.hashPassword({ password });
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
}
