import { BadRequestException, Injectable } from "@nestjs/common";
import { Order } from "./entities/order.entity";
import { DataSource } from "typeorm";
import { OrderDetail } from "./entities/order-detail.entity";
import { CreateOrderDto } from "./dto/create-order.dto";
import { Orders } from "./utils/type";
import { Product } from "src/product/entities/product.entity";

@Injectable()
export class OrderService {
  constructor(private dataSource: DataSource) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order | null> {
    const { customerId, orderStatus, shippingAddress, product } =
      createOrderDto;
    let orders: Orders[] = [];

    return await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const orderDetailRepo = manager.getRepository(OrderDetail);
      const productRepo = manager.getRepository(Product);

      if(!Array.isArray(product)){
        const productData = await productRepo.findOneBy({
          id: product.productId,
        });
        if(productData && product.quantity > productData.stockQuantity){
          throw new BadRequestException("You cannot purchase products with a quantity ordered greater than the available stock");
        }
      }else{
        for(const productItem of product){
          const productData = await productRepo.findOneBy({
            id: productItem.productId,
          });
          if(productData && productItem.quantity > productData.stockQuantity){
            throw new BadRequestException("You cannot purchase products with a quantity ordered greater than the available stock");
          }
        }
      }

      const orderSave = orderRepo.create({
        customerId,
        orderStatus,
        shippingAddress,
      });
      const order = await orderRepo.save(orderSave);

      if (Array.isArray(product) && product.length !== 0) {
        const ordersData = product.map((productItem) => ({
          orderId: order.id,
          productId: productItem.productId,
          quantity: productItem.quantity,
          unitPrice: productItem.unitPrice,
          totalPrice: productItem.quantity * productItem.unitPrice,
        }));
        orders.push(...ordersData);
      } else if (!Array.isArray(product)) {
        const orderData = {
          orderId: order.id,
          productId: product.productId,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          totalPrice: product.quantity * product.unitPrice,
        };
        orders.push(orderData);
      }

      const orderDetail = orderDetailRepo.create(orders);
      const orderDetailSave = await orderDetailRepo.save(orderDetail);
      const totalAmount = orderDetailSave.reduce(
        (prevValue, orderDetailItem) => orderDetailItem.totalPrice + prevValue,
        0,
      );

      await orderRepo.update(order.id, {
        totalAmount,
      });

      if (!Array.isArray(product)) {
        const productData = await productRepo.findOneBy({
          id: product.productId,
        });

        if (productData) {
          await productRepo.update(productData.id, {
            stockQuantity: productData.stockQuantity - product.quantity,
          });
        }
      } else {
        product.forEach(async (productItem) => {
          const productData = await productRepo.findOneBy({
            id: productItem.productId,
          });

          if (productData) {
            await productRepo.update(productData.id, {
              stockQuantity: productData.stockQuantity - productItem.quantity,
            });
          }
        });
      }

      return await orderRepo.findOne({
        where: {
          id: order.id,
        },
        relations: {
          orders: true,
        },
      });
    });
  }
}
