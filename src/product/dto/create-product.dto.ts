import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
    IsString,
    IsNotEmpty,
    IsInt,
    IsNumber,
} from 'class-validator';

export class CreateProductDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    price: number;

    @ApiProperty()
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    stockQuantity: number;

    @ApiProperty()
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    categoryId: number;

    @ApiProperty({
        type: "array",
        items: {
            type: "string",
            format: "binary",
        },
        maxItems: 4,
    })
    images: Express.Multer.File[];
}