import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AtAuthGuard extends AuthGuard('at-jwt') {}