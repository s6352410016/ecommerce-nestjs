import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CreateProductDto } from "./dto/create-product.dto";
import Stripe from "stripe";
import { UpdateProductDto } from "./dto/update-product.dto";
import { CheckOutSessionDto } from "./dto/checkout-session.dto";
import { OrderService } from "src/order/order.service";
import { OrderStatus } from "src/order/utils/type";
import { Order } from "src/order/entities/order.entity";
import { Request } from "express";

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY as string);

  constructor(
    private configService: ConfigService,
    private orderService: OrderService,
  ) {}

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

  async updateProductImage(
    stripeProductId: string,
    oldImage: string,
    newImage: string,
  ): Promise<Stripe.Response<Stripe.Product>> {
    const product = await this.stripe.products.retrieve(stripeProductId);
    let productImages = product.images;
    const indexOldImage = productImages.indexOf(oldImage);
    if (indexOldImage !== 1) {
      productImages = productImages.map((image, index) => {
        if (indexOldImage === index) {
          return newImage;
        }
        return image;
      });

      const productUpdate = await this.stripe.products.update(product.id, {
        images: productImages,
      });

      return productUpdate;
    }

    throw new NotFoundException(
      "Error cannot update product image on stripe because invalid index of old image",
    );
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

  async checkOutSession(
    checkOutSessionDto: CheckOutSessionDto,
  ): Promise<Order> {
    const { customerId, shippingAddress, product } = checkOutSessionDto;

    let session: Stripe.Response<Stripe.Checkout.Session>;

    if (Array.isArray(product) && product.length !== 0) {
      session = await this.stripe.checkout.sessions.create({
        success_url: `${this.configService.get<string>("CLIENT_URL")}/checkout?success=true`,
        cancel_url: `${this.configService.get<string>("CLIENT_URL")}/checkout?success=false`,
        line_items: product.map((productItem) => ({
          price: productItem.priceId,
          quantity: productItem.quantity,
        })),
        mode: "payment",
      });

      const order = await this.orderService.create({
        customerId,
        orderStatus:
          session.status === "open" ? OrderStatus.OPEN : OrderStatus.UNPAID,
        shippingAddress,
        product,
        sessionId: session.id,
      });

      if (order) {
        return order;
      }

      throw new InternalServerErrorException(
        "Cannot create order because something went wrong",
      );
    } else if (!Array.isArray(product)) {
      session = await this.stripe.checkout.sessions.create({
        success_url: `${this.configService.get<string>("CLIENT_URL")}/checkout?success=true`,
        cancel_url: `${this.configService.get<string>("CLIENT_URL")}/checkout?success=false`,
        line_items: [
          {
            price: product.priceId,
            quantity: product.quantity,
          },
        ],
        mode: "payment",
      });

      const order = await this.orderService.create({
        customerId,
        orderStatus:
          session.status === "open" ? OrderStatus.OPEN : OrderStatus.UNPAID,
        shippingAddress,
        product,
        sessionId: session.id,
      });

      if (order) {
        return order;
      }

      throw new InternalServerErrorException(
        "Cannot create order because something went wrong",
      );
    }

    throw new InternalServerErrorException("Error something went wrong");
  }

  async webhook(req: Request) {
    let event = req.body;

    const endPointSecret = "whsec_ea16113357141610947a2b8f6e6c9c4ec6d7bc10369b330208b14b5c9a112a4e";

    if (endPointSecret) {
      const signature = req.headers["stripe-signature"];

      if (signature) {
        event = this.stripe.webhooks.constructEvent(
          req.body,
          signature,
          endPointSecret,
        );
      }
    }

    switch(event.type){
      case "checkout.session.completed":
        const checkOutData = event.data.object as Stripe.Checkout.Session;
        if(checkOutData.status){
          await this.orderService.update(checkOutData.id, checkOutData.status);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}.`);
        break;
    }
  }
}
