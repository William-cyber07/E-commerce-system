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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const paystack_sdk_1 = require("@paystack/paystack-sdk");
let PaymentsService = class PaymentsService {
    paystack;
    constructor() {
        console.log("PAYSTACK KEY LOADED:", process.env.PAYSTACK_SECRET_KEY?.substring(0, 15) + "...");
        this.paystack = new paystack_sdk_1.Paystack(process.env.PAYSTACK_SECRET_KEY);
    }
    async initializeTransaction(amountCents, email, orderId, cartId) {
        try {
            const response = await this.paystack.transaction.initialize({
                amount: amountCents,
                email,
                // 👇 REPLACE THIS with your active ngrok URL
                callback_url: "https://customary-headlock-clinking.ngrok-free.dev/checkout/success",
                metadata: JSON.stringify({ orderId, cartId }),
            });
            // 👇 ADD THIS: Check if Paystack actually returned a successful status
            if (!response || !response.status) {
                // Log the exact error Paystack sent back
                console.error("Paystack API Error:", response?.message);
                throw new Error(response?.message || "Paystack initialization failed");
            }
            return response.data;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Paystack Init Error:", errorMessage);
            throw new common_1.InternalServerErrorException(errorMessage || "Failed to initialize payment");
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PaymentsService);
