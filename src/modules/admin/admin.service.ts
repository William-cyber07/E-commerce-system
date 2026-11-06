import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { OrderStatus } from "@prisma/client";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // --- PRODUCTS ---

  async createProduct(dto: CreateProductDto) {
    // Generate a URL-friendly slug if one isn't provided
    const slug = dto.slug || dto.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    return this.prisma.product.create({
      data: {
        title: dto.title,
        description: dto.description,
        slug,
        status: "ACTIVE",
        variants: {
          create: dto.variants,
        },
        images: {
          create: dto.imageUrls?.map((url, index) => ({ url, position: index })),
        },
      },
      include: { variants: true, images: true },
    });
  }

  async deleteProduct(productId: string) {
    // Note: If a product has been ordered, Prisma will throw a foreign key constraint error.
    // In a real system, you might want to set the status to "ARCHIVED" instead of deleting.
    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  // --- ORDERS ---

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        items: true,
        user: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}