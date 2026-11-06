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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // --- PRODUCTS ---
    async createProduct(dto) {
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
    async deleteProduct(productId) {
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
    async updateOrderStatus(orderId, status) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException("Order not found");
        return this.prisma.order.update({
            where: { id: orderId },
            data: { status },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
