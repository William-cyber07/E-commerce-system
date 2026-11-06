import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ReservationStatus } from "@prisma/client";
import { Cron, CronExpression } from "@nestjs/schedule"; // <-- New import

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // Reserve stock for a cart (15 minutes)
  async reserveStock(cartId: string, items: { variantId: string; quantity: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });
        if (!variant) throw new BadRequestException(`Variant ${item.variantId} not found`);

        const activeReservations = await tx.inventoryReservation.aggregate({
          where: {
            variantId: item.variantId,
            status: ReservationStatus.PENDING,
            expiresAt: { gt: new Date() },
          },
          _sum: { quantity: true },
        });

        const reservedQty = activeReservations._sum.quantity || 0;
        const availableStock = variant.stockQty - reservedQty;

        if (availableStock < item.quantity) {
          throw new BadRequestException(`Not enough stock for ${variant.name}. Available: ${availableStock}`);
        }

        await tx.inventoryReservation.create({
          data: {
            variantId: item.variantId,
            cartId,
            quantity: item.quantity,
            status: ReservationStatus.PENDING,
            expiresAt,
          },
        });
      }
    });
  }

  // Confirm stock after successful payment
  async confirmReservations(cartId: string) {
    return this.prisma.inventoryReservation.updateMany({
      where: { cartId, status: ReservationStatus.PENDING },
      data: { status: ReservationStatus.CONFIRMED },
    });
  }

  // Release stock if payment fails or user abandons
  async releaseReservations(cartId: string) {
    return this.prisma.inventoryReservation.updateMany({
      where: { cartId, status: ReservationStatus.PENDING },
      data: { status: ReservationStatus.RELEASED },
    });
  }

  // 👇 THIS IS THE NEW CRON JOB YOU JUST ASKED ABOUT 👇
  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredReservations() {
    const result = await this.prisma.inventoryReservation.updateMany({
      where: {
        status: ReservationStatus.PENDING,
        expiresAt: { lt: new Date() }, // Less than right now
      },
      data: { status: ReservationStatus.RELEASED },
    });

    if (result.count > 0) {
      console.log(`🧹 Released ${result.count} expired inventory reservations.`);
    }
  }
}