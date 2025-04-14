export class CreateProductDto {
  id: number;

  name: string;

  description: string;

  price: number;

  stockQuantity: number;

  categoryId: number;

  images: string[];
}
