import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OrderStatus } from "@prisma/client";

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createPendingOrder(cart: any, totals: any, email: string, shippingAddress: any) {
    return this.prisma.order.create({
      data: {
        email,
        status: OrderStatus.PENDING_PAYMENT,
        subtotalCents: totals.subtotalCents,
        totalCents: totals.totalCents,
        currency: "USD",
        shippingAddress,
        items: {
          create: cart.items.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            snapshotJson: {
              title: item.variant.product.title,
              variantName: item.variant.name,
              sku: item.variant.sku,
            },
          })),
        },
      },
      include: { items: true },
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, paystackReference?: string) {
  return this.prisma.order.update({
    where: { id: orderId },
    data: { 
      status, 
      ...(paystackReference && { paystackReference }) // <-- Changed
    },
  });
}

  async addOrderEvent(orderId: string, eventType: string, payload?: any) {
    return this.prisma.orderEvent.create({
      data: { orderId, eventType, payload },
    });
  }
}