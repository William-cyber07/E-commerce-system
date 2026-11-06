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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CartService = class CartService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateCart(owner) {
        const { userId, sessionId } = owner;
        if (!userId && !sessionId)
            throw new common_1.BadRequestException("No cart owner");
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
    async addItem(owner, variantId, quantity) {
        const cart = await this.getOrCreateCart(owner);
        const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
        if (!variant)
            throw new common_1.NotFoundException("Variant not found");
        const existing = cart.items.find((i) => i.variantId === variantId);
        const newQty = (existing?.quantity ?? 0) + quantity;
        if (newQty > variant.stockQty)
            throw new common_1.BadRequestException("Insufficient stock");
        if (existing) {
            await this.prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: newQty },
            });
        }
        else {
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
    async updateItem(owner, itemId, quantity) {
        const cart = await this.getOrCreateCart(owner);
        const item = cart.items.find((i) => i.id === itemId);
        if (!item)
            throw new common_1.NotFoundException("Item not in cart");
        if (quantity <= 0) {
            await this.prisma.cartItem.delete({ where: { id: itemId } });
        }
        else {
            await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
        }
        return this.getOrCreateCart(owner);
    }
    async removeItem(owner, itemId) {
        await this.prisma.cartItem.delete({ where: { id: itemId } }).catch(() => { });
        return this.getOrCreateCart(owner);
    }
    // Compute totals — call this at checkout too
    computeTotals(cart) {
        const subtotal = cart.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
        return {
            subtotalCents: subtotal,
            totalCents: subtotal, // add tax + shipping later
            itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
        };
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CartService);
