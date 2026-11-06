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
exports.CheckoutService = void 0;
const common_1 = require("@nestjs/common");
const cart_service_1 = require("../cart/cart.service");
const inventory_service_1 = require("../inventory/inventory.service");
const orders_service_1 = require("../orders/orders.service");
const payments_service_1 = require("../payments/payments.service");
let CheckoutService = class CheckoutService {
    cartService;
    inventoryService;
    ordersService;
    paymentsService;
    constructor(cartService, inventoryService, ordersService, paymentsService) {
        this.cartService = cartService;
        this.inventoryService = inventoryService;
        this.ordersService = ordersService;
        this.paymentsService = paymentsService;
    }
    async processCheckout(owner, dto) {
        // 1. Get the cart
        const cart = await this.cartService.getOrCreateCart(owner);
        if (!cart.items.length)
            throw new common_1.BadRequestException("Cart is empty");
        // 2. Compute totals
        const totals = this.cartService.computeTotals(cart);
        // 3. Reserve inventory for 15 minutes (throws if out of stock)
        await this.inventoryService.reserveStock(cart.id, cart.items);
        // 4. Create the pending order in the DB
        const order = await this.ordersService.createPendingOrder(cart, totals, dto.email, dto.shippingAddress);
        await this.ordersService.addOrderEvent(order.id, "order.created");
        // ... inside processCheckout
        // 5. Initialize Paystack Transaction
        const paystackData = await this.paymentsService.initializeTransaction(order.totalCents, order.email, order.id, cart.id);
        if (!paystackData || !paystackData.reference) {
            throw new common_1.BadRequestException("Failed to get payment reference from Paystack");
        }
        // 6. Save the paystack reference to the order
        await this.ordersService.updateOrderStatus(order.id, "PENDING_PAYMENT", paystackData.reference);
        // 7. Return the authorization URL to the frontend
        return {
            orderId: order.id,
            authorizationUrl: paystackData.authorization_url, // The frontend redirects here
            reference: paystackData.reference,
            totalCents: order.totalCents,
        };
    }
};
exports.CheckoutService = CheckoutService;
exports.CheckoutService = CheckoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cart_service_1.CartService,
        inventory_service_1.InventoryService,
        orders_service_1.OrdersService,
        payments_service_1.PaymentsService])
], CheckoutService);
