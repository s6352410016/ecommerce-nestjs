import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Order } from "./entities/order.entity";
import { DataSource } from "typeorm";
import { OrderDetail } from "./entities/order-detail.entity";
import { CreateOrderDto } from "./dto/create-order.dto";
import { Product } from "src/product/entities/product.entity";

@Injectable()
export class OrderService {
  constructor(private dataSource: DataSource) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order | null> {
    const { customerId, orderStatus, shippingAddress, product, sessionId } =
      createOrderDto;
    let orderDetailsArray: Omit<
      OrderDetail,
      "id" | "createdAt" | "updatedAt"
    >[] = [];

    return await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const orderDetailRepo = manager.getRepository(OrderDetail);
      const productRepo = manager.getRepository(Product);

      const findProductById = async (id: number): Promise<Product | null> => {
        return await productRepo.findOneBy({
          id,
        });
      };

      const updateStockOfProduct = async (
        productId: number,
        stockQuantity: number,
      ) => {
        await productRepo.update(productId, {
          stockQuantity,
        });
      };

      if (!Array.isArray(product)) {
        const productData = await findProductById(product.productId);
        if (!productData) {
          throw new NotFoundException("Product not found");
        }

        if (product.quantity > productData.stockQuantity) {
          throw new BadRequestException(
            "You cannot purchase products with a quantity ordered greater than the available stock",
          );
        }
      } else {
        for (const productItem of product) {
          const productData = await findProductById(productItem.productId);
          if (!productData) {
            throw new NotFoundException("Product not found");
          }

          if (productItem.quantity > productData.stockQuantity) {
            throw new BadRequestException(
              "You cannot purchase products with a quantity ordered greater than the available stock",
            );
          }
        }
      }

      const orderSave = orderRepo.create({
        customerId,
        orderStatus,
        shippingAddress,
        sessionId,
      });
      const order = await orderRepo.save(orderSave);

      if (Array.isArray(product) && product.length !== 0) {
        const orderDetailsData = product.map(async (productItem) => {
          const product = await findProductById(productItem.productId);
          if (!product) {
            throw new NotFoundException("Product not found");
          }

          return {
            order,
            product,
            quantity: productItem.quantity,
            unitPrice: productItem.unitPrice,
            totalPrice: productItem.quantity * productItem.unitPrice,
          };
        });

        const orderDetails = await Promise.all(orderDetailsData);

        orderDetailsArray.push(...orderDetails);
      } else if (!Array.isArray(product)) {
        const productData = await findProductById(product.productId);
        if (!productData) {
          throw new NotFoundException("Product not found");
        }

        const orderDetailsData = {
          order,
          product: productData,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          totalPrice: product.quantity * product.unitPrice,
        };
        orderDetailsArray.push(orderDetailsData);
      }

      const orderDetails = orderDetailRepo.create(orderDetailsArray);
      const orderDetailsSave = await orderDetailRepo.save(orderDetails);
      const totalAmount = orderDetailsSave.reduce(
        (prevValue, orderDetailItem) => orderDetailItem.totalPrice + prevValue,
        0,
      );

      await orderRepo.update(order.id, {
        totalAmount,
      });

      if (!Array.isArray(product)) {
        const productData = await findProductById(product.productId);
        if (!productData) {
          throw new NotFoundException("Product not found");
        }

        await updateStockOfProduct(
          product.productId,
          productData.stockQuantity - product.quantity,
        );
      } else {
        for (const productItem of product) {
          const productData = await findProductById(productItem.productId);
          if (!productData) {
            throw new NotFoundException("Product not found");
          }

          await updateStockOfProduct(
            productItem.productId,
            productData.stockQuantity - productItem.quantity,
          );
        }
      }

      return await orderRepo.findOne({
        where: {
          id: order.id,
        },
        relations: {
          orders: {
            product: {
              category: true,
              images: true,
            },
          },
        },
      });
    });
  }
}
