import { type PrismaClient } from '@prisma/client';
import type UserEntity from '../../../../domain/entities/user.entity';
import { hashSync } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import env from '../../../config/env';

export default class UserService {
  prisma: PrismaClient;

  constructor(client: PrismaClient) {
    this.prisma = client;
  }

  async create(user: UserEntity) {
    const userIsValid = user.isValid();

    if (userIsValid instanceof Error) {
      throw userIsValid;
    }

    const userExist = await this.prisma.user.findFirst({
      where: {
        email: user.email,
      },
    });

    if (userExist) {
      throw new Error('O email informado já está em uso');
    }

    const createUser = await this.prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashSync(user.password, 10),
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: false,
      },
    });

    return {
      user: createUser,
      token: sign({ id: createUser.id }, env.jwtSecret),
    };
  }
}