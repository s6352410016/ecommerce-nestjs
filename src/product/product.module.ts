import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-images.entity';
import { Category } from 'src/category/entity/category.entity';
import { CategoryModule } from 'src/category/category.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      Category
    ]),
    CategoryModule,
    StripeModule,
  ],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule {}
