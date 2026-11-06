import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async listProducts(params: { search?: string; category?: string; limit?: number; offset?: number }) {
    const { search, category, limit = 20, offset = 0 } = params;

    const where: any = { status: "ACTIVE" };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.categories = { some: { category: { slug: category } } };
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          variants: true,
          categories: { include: { category: true } },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: true,
        categories: { include: { category: true } },
      },
    });
    if (!product || product.status !== "ACTIVE") throw new NotFoundException("Product not found");
    return product;
  }

  async listCategories() {
    return this.prisma.category.findMany({
      include: { children: true },
    });
  }
}