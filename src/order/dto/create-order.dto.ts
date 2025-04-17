import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { OrderStatus } from "../utils/type";

class ProductOrder {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;
}

export class CreateOrderDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  customerId: number;

  @IsEnum(OrderStatus)
  @IsNotEmpty()
  orderStatus: OrderStatus;

  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ValidateNested({ each: true })
  @Type(() => ProductOrder)
  product: ProductOrder | ProductOrder[];

  @IsString()
  @IsNotEmpty()
  sessionId: string;
}