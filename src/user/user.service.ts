import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        email: true,
      },
    });
    return users;
  }

  async getUser({ userId }: { userId: string }) {
    const users = await this.prisma.user.findUnique({
      where: {
        id: parseInt(userId, 10),
      },
      select: {
        id: true,
        firstName: true,
        email: true,
      },
    });
    return users;
  }
}
