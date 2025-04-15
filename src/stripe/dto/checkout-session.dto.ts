import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CheckOutSessionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  price: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  quantity: number;
}
