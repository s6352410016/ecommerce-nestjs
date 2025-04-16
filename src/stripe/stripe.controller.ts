import { Body, Controller, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { CheckOutSessionDto, Product } from "./dto/checkout-session.dto";
import { ApiBody, ApiResponse, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { AtAuthGuard } from "src/auth/guards/at-auth.guard";
import { Order } from "src/order/entities/order.entity";

@UseGuards(AtAuthGuard)
@ApiTags("stripe")
@Controller("stripe")
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @ApiResponse({
    type: Order,
    status: HttpStatus.CREATED
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        customerId: {
          type: "number",
          description: "Customer ID",
        },
        shippingAddress: {
          type: "string",
          description: "Shipping address for the order",
        },
        product: {
          oneOf: [
            {
              $ref: getSchemaPath(Product),
            },
            {
              type: "array",
              items: {
                $ref: getSchemaPath(Product),
              },
            },
          ],
        },
      },
      required: ["customerId", "totalAmount", "shippingAddress", "product"],
    },
  })
  @Post("checkout-session")
  checkOutSession(@Body() checkOutSessionDto: CheckOutSessionDto): Promise<Order> {
    return this.stripeService.checkOutSession(checkOutSessionDto);
  }
}
