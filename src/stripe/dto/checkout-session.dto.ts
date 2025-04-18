import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsInt, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";

export class ProductCheckOut {
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
  userId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: [ProductCheckOut] })
  @ValidateNested({ each: true })
  @Type(() => ProductCheckOut)
  @IsNotEmpty()
  product: ProductCheckOut | ProductCheckOut[];
}