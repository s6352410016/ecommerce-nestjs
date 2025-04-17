import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { OrderModule } from 'src/order/order.module';
import { RawBodyMiddleware } from 'src/middleware/raw-body.middleware';

@Module({
  imports: [OrderModule],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})

export class StripeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RawBodyMiddleware).forRoutes("/api/stripe/webhook");
  }
}