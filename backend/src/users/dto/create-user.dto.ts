export class CreateUserDto {
    email: string;
    name: string;
    role: 'digital' | 'operador';
    wallet?: string;
}
