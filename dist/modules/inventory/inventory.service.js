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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const schedule_1 = require("@nestjs/schedule"); // <-- New import
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Reserve stock for a cart (15 minutes)
    async reserveStock(cartId, items) {
        return this.prisma.$transaction(async (tx) => {
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now
            for (const item of items) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                });
                if (!variant)
                    throw new common_1.BadRequestException(`Variant ${item.variantId} not found`);
                const activeReservations = await tx.inventoryReservation.aggregate({
                    where: {
                        variantId: item.variantId,
                        status: client_1.ReservationStatus.PENDING,
                        expiresAt: { gt: new Date() },
                    },
                    _sum: { quantity: true },
                });
                const reservedQty = activeReservations._sum.quantity || 0;
                const availableStock = variant.stockQty - reservedQty;
                if (availableStock < item.quantity) {
                    throw new common_1.BadRequestException(`Not enough stock for ${variant.name}. Available: ${availableStock}`);
                }
                await tx.inventoryReservation.create({
                    data: {
                        variantId: item.variantId,
                        cartId,
                        quantity: item.quantity,
                        status: client_1.ReservationStatus.PENDING,
                        expiresAt,
                    },
                });
            }
        });
    }
    // Confirm stock after successful payment
    async confirmReservations(cartId) {
        return this.prisma.inventoryReservation.updateMany({
            where: { cartId, status: client_1.ReservationStatus.PENDING },
            data: { status: client_1.ReservationStatus.CONFIRMED },
        });
    }
    // Release stock if payment fails or user abandons
    async releaseReservations(cartId) {
        return this.prisma.inventoryReservation.updateMany({
            where: { cartId, status: client_1.ReservationStatus.PENDING },
            data: { status: client_1.ReservationStatus.RELEASED },
        });
    }
    // 👇 THIS IS THE NEW CRON JOB YOU JUST ASKED ABOUT 👇
    async releaseExpiredReservations() {
        const result = await this.prisma.inventoryReservation.updateMany({
            where: {
                status: client_1.ReservationStatus.PENDING,
                expiresAt: { lt: new Date() }, // Less than right now
            },
            data: { status: client_1.ReservationStatus.RELEASED },
        });
        if (result.count > 0) {
            console.log(`🧹 Released ${result.count} expired inventory reservations.`);
        }
    }
};
exports.InventoryService = InventoryService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryService.prototype, "releaseExpiredReservations", null);
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
