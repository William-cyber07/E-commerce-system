"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const orders_service_1 = require("../orders/orders.service");
const inventory_service_1 = require("../inventory/inventory.service");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    ordersService;
    inventoryService;
    logger = new common_1.Logger(WebhooksController_1.name);
    constructor(ordersService, inventoryService) {
        this.ordersService = ordersService;
        this.inventoryService = inventoryService;
    }
    async handlePaystackWebhook(body, signature) {
        // 1. Verify the webhook signature using native crypto
        const secret = process.env.PAYSTACK_SECRET_KEY;
        const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(body)).digest("hex");
        if (hash !== signature) {
            this.logger.warn("Invalid Paystack webhook signature");
            throw new common_1.BadRequestException("Invalid signature");
        }
        // 2. Handle successful payment
        if (body.event === "charge.success") {
            const { reference, metadata } = body.data;
            const { orderId, cartId } = metadata;
            this.logger.log(`💰 Payment successful for Order: ${orderId} | Ref: ${reference}`);
            // 3. Mark order as PAID
            await this.ordersService.updateOrderStatus(orderId, "PAID");
            // 4. Confirm inventory reservations
            await this.inventoryService.confirmReservations(cartId);
            // 5. Add order event log
            await this.ordersService.addOrderEvent(orderId, "payment.success", body.data);
        }
        return { status: "success" };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)("paystack"),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)("x-paystack-signature")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handlePaystackWebhook", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)("webhooks"),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        inventory_service_1.InventoryService])
], WebhooksController);
