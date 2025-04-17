import { NestMiddleware } from '@nestjs/common';
import express, { Request, Response, NextFunction } from 'express';

export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction){
    // express.raw({ type: "application/json" })(req, res, next);
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
  }
}