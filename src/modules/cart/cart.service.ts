import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

interface CartOwner { userId?: string; sessionId?: string }

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(owner: CartOwner) {
    const { userId, sessionId } = owner;
    if (!userId && !sessionId) throw new BadRequestException("No cart owner");

    let cart = await this.prisma.cart.findFirst({
      where: {
        status: "ACTIVE",
        ...(userId ? { userId } : { sessionId }),
      },
      include: { items: { include: { variant: { include: { product: true } } } } },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, sessionId },
        include: { items: { include: { variant: { include: { product: true } } } } },
      });
    }
    return cart;
  }

  async addItem(owner: CartOwner, variantId: string, quantity: number) {
    const cart = await this.getOrCreateCart(owner);
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException("Variant not found");

    const existing = cart.items.find((i) => i.variantId === variantId);
    const newQty = (existing?.quantity ?? 0) + quantity;
    if (newQty > variant.stockQty) throw new BadRequestException("Insufficient stock");

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
          unitPriceCents: variant.priceCents,
        },
      });
    }
    return this.getOrCreateCart(owner);
  }

  async updateItem(owner: CartOwner, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(owner);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException("Item not in cart");

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }
    return this.getOrCreateCart(owner);
  }

  async removeItem(owner: CartOwner, itemId: string) {
    await this.prisma.cartItem.delete({ where: { id: itemId } }).catch(() => {});
    return this.getOrCreateCart(owner);
  }

  // Compute totals — call this at checkout too
  computeTotals(cart: any) {
    const subtotal = cart.items.reduce(
      (sum: number, i: any) => sum + i.unitPriceCents * i.quantity,
      0
    );
    return {
      subtotalCents: subtotal,
      totalCents: subtotal, // add tax + shipping later
      itemCount: cart.items.reduce((s: number, i: any) => s + i.quantity, 0),
    };
  }
}