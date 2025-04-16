import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";

export class Product {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  priceId: string;
}

export class CheckOutSessionDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  customerId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiProperty({ type: [Product] })
  @ValidateNested({ each: true })
  @Type(() => Product)
  @IsNotEmpty()
  product: Product | Product[];
}