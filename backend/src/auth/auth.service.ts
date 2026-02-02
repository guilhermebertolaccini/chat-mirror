import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email) as any;
        if (user && user.password && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;

            // Enforce role check: Only 'digital' can log in to platform
            if (result.role !== 'digital') {
                throw new UnauthorizedException('Acesso negado: Apenas administradores podem logar.');
            }

            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role, name: user.name };
        return {
            access_token: this.jwtService.sign(payload),
            user: payload
        };
    }
}
