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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPendingOrder(cart, totals, email, shippingAddress) {
        return this.prisma.order.create({
            data: {
                email,
                status: client_1.OrderStatus.PENDING_PAYMENT,
                subtotalCents: totals.subtotalCents,
                totalCents: totals.totalCents,
                currency: "USD",
                shippingAddress,
                items: {
                    create: cart.items.map((item) => ({
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
    async updateOrderStatus(orderId, status, paystackReference) {
        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                ...(paystackReference && { paystackReference }) // <-- Changed
            },
        });
    }
    async addOrderEvent(orderId, eventType, payload) {
        return this.prisma.orderEvent.create({
            data: { orderId, eventType, payload },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
