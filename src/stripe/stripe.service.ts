import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CreateProductDto } from "./dto/create-product.dto";
import Stripe from "stripe";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY as string);

  constructor(private configService: ConfigService) {}

  async createProduct(createProductDto: CreateProductDto): Promise<{
    productData: Stripe.Response<Stripe.Product>;
    priceData: Stripe.Response<Stripe.Price>;
  }> {
    const { id, name, description, price, stockQuantity, categoryId, images } =
      createProductDto;
    const productData = await this.stripe.products.create({
      name,
      description,
      metadata: {
        productId: id,
        categoryId,
        stockQuantity,
      },
      images,
      unit_label: "item",
    });

    const priceData = await this.stripe.prices.create({
      currency: "THB",
      unit_amount_decimal: String(price * 100), //แปลงเป็น สตางค์ ก่อนส่งไป stripe เพราะ stripe มันจะแปลงกับเป็น บาท ไม่งั้นราคามันจะผิด
      product: productData.id,
    });

    return {
      productData,
      priceData,
    };
  }

  async updateProduct(updateProductDto: UpdateProductDto): Promise<{
    updatePriceProduct: Stripe.Response<Stripe.Product>;
    priceUpdate: Stripe.Response<Stripe.Price>;
  }> {
    const {
      name,
      description,
      price,
      stockQuantity,
      categoryId,
      stripeProductId,
      stripePriceId,
      unitLabel,
    } = updateProductDto;

    const productUpdate = await this.stripe.products.update(stripeProductId, {
      name,
      description,
      metadata: {
        categoryId,
        stockQuantity,
      },
      unit_label: unitLabel,
    });

    const priceUpdate = await this.stripe.prices.create({
      currency: "THB",
      unit_amount_decimal: String(price * 100), //แปลงเป็น สตางค์ ก่อนส่งไป stripe เพราะ stripe มันจะแปลงกับเป็น บาท ไม่งั้นราคามันจะผิด
      product: productUpdate.id,
    });

    const updatePriceProduct = await this.stripe.products.update(
      productUpdate.id,
      {
        default_price: priceUpdate.id,
      },
    );

    await this.stripe.prices.update(stripePriceId, {
      active: false,
    });

    return {
      updatePriceProduct,
      priceUpdate,
    };
  }

  async deleteProduct(productId: string) {
    const prices = await this.stripe.prices.list({
      product: productId,
    });

    for (const price of prices.data) {
      await this.stripe.prices.update(price.id, {
        active: false,
      });
    }

    await this.stripe.products.update(productId, {
      active: false,
    });
  }

  async deleteProductImage(
    stripeProductId: string,
    image: string,
  ): Promise<Stripe.Response<Stripe.Product>> {
    const product = await this.stripe.products.retrieve(stripeProductId);
    let productImages = product.images;
    const imageIndex = product.images.indexOf(image);

    if (imageIndex !== -1) {
      productImages = productImages.filter((_, index) => index !== imageIndex);
    }

    const productUpdate = await this.stripe.products.update(stripeProductId, {
      images: productImages,
    });

    return productUpdate;
  }
}
