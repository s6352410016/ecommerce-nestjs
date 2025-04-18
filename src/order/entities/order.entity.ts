import { ApiProperty } from "@nestjs/swagger";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderDetail } from "./order-detail.entity";
import { OrderStatus } from "../utils/type";
import { User } from "src/users/entity/user.entity";

@Entity("order")
export class Order {
  @ApiProperty()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty()
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

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

  @ApiProperty()
  @Column({ type: "varchar", length: 20 })
  phone: string;
  
  @ApiProperty()
  @Column({ type: "varchar", length: 255 })
  email: string;

  @ApiProperty({ type: [OrderDetail] })
  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order)
  orders: OrderDetail[];

  @ApiProperty()
  @Column({ type: "varchar", length: 255, name: "session_id" })
  sessionId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty()
  clientSecret: string
}