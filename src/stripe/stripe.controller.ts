import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CheckOutSessionDto } from './dto/checkout-session.dto';
import { ApiBody, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AtAuthGuard } from 'src/auth/guards/at-auth.guard';
import { CheckOutSessionRes } from './utils/checkout-session-res';

@UseGuards(AtAuthGuard)
@ApiTags("stripe")
@Controller("stripe")
export class StripeController {
  constructor(private stripeService: StripeService){}

  @ApiResponse({
    type: CheckOutSessionRes,
    description: "open checkout page from stripe",
    status: HttpStatus.OK
  })
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CheckOutSessionDto) },
        {
          type: 'array',
          items: { $ref: getSchemaPath(CheckOutSessionDto) },
        },
      ],
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post("checkout-session")
  checkOutSession(@Body() checkOutSessionDto: CheckOutSessionDto | CheckOutSessionDto[]): Promise<CheckOutSessionRes>{
    return this.stripeService.checkOutSession(checkOutSessionDto);
  }
}
