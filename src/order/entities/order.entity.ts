import { ApiProperty } from "@nestjs/swagger";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderDetail } from "./order-detail.entity";
import { OrderStatus } from "../utils/type";

@Entity("order")
export class Order {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @Column({ type: "int", name: "customer_id" })
  customerId: number;

  @ApiProperty()
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
        to(data: number): number {
            return data;
        },
        from(data: string): number {
            return parseFloat(data);
        }
    },
    nullable: true,
  })
  totalAmount?: number;

  @ApiProperty()
  @Column({ type: "enum", default: "unpaid", enum: ["paid", "unpaid", "open"], name: "order_status" })
  orderStatus: OrderStatus;

  @ApiProperty()
  @Column({ type: "text", name: "shipping_address" })
  shippingAddress: string;

  @ApiProperty({ type: [OrderDetail] })
  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order)
  orders: OrderDetail[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}