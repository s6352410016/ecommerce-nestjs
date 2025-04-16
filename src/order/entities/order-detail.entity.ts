import { ApiProperty } from "@nestjs/swagger";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Order } from "./order.entity";

@Entity("order_detail")
export class OrderDetail {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ type: "uuid", name: "order_id" })
  orderId: string;

  @ApiProperty()
  @Column({ type: "int", name: "product_id" })
  productId: number;

  @ApiProperty()
  @Column({ type: "int" })
  quantity: number;

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
      },
    },
    name: "unit_price",
  })
  unitPrice: number;

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
      },
    },
    name: "total_price",
  })
  totalPrice: number;

  @ApiProperty({ type: Order })
  @ManyToOne(() => Order, (order) => order.orders, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order: Order;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
