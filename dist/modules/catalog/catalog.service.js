"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CatalogService = class CatalogService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listProducts(params) {
        const { search, category, limit = 20, offset = 0 } = params;
        const where = { status: "ACTIVE" };
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
    async getProductBySlug(slug) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: {
                images: { orderBy: { position: "asc" } },
                variants: true,
                categories: { include: { category: true } },
            },
        });
        if (!product || product.status !== "ACTIVE")
            throw new common_1.NotFoundException("Product not found");
        return product;
    }
    async listCategories() {
        return this.prisma.category.findMany({
            include: { children: true },
        });
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogService);
