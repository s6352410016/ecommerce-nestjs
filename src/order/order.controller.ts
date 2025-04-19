import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { AtAuthGuard } from "src/auth/guards/at-auth.guard";
import { OrderService } from "./order.service";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { CommonRes } from "./utils/common-res";
import { Order } from "./entities/order.entity";

@ApiTags("order")
@UseGuards(AtAuthGuard)
@Controller("order")
export class OrderController {
  constructor(private orderService: OrderService) {}

  @ApiResponse({
    type: CommonRes,
    status: HttpStatus.OK,
  })
  @Get("status/:orderId")
  checkOrderStatus(
    @Param("orderId", new ParseUUIDPipe()) orderId: string,
  ): Promise<{ status: string }> {
    return this.orderService.checkOrderStatus(orderId);
  }

  @ApiResponse({
    type: [Order],
    status: HttpStatus.OK,
  })
  @Get("user/:userId")
  async getOrdersByUserId(
    @Param("userId", new ParseIntPipe()) userId: number,
  ): Promise<Order[]> {
    return await this.orderService.getOrderByUserId(userId);
  }
}
