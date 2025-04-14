export class UpdateProductDto {
  name: string;

  description: string;

  price: number;

  stockQuantity: number;

  categoryId: number;

  stripeProductId: string;

  stripePriceId: string;

  unitLabel: string;
}
