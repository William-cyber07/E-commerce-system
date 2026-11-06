import { Controller, Post, Body, Headers, HttpCode, BadRequestException, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import { OrdersService } from "../orders/orders.service";
import { InventoryService } from "../inventory/inventory.service";

@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private ordersService: OrdersService,
    private inventoryService: InventoryService,
  ) {}

  @Post("paystack")
  @HttpCode(200)
  async handlePaystackWebhook(
    @Body() body: any,
    @Headers("x-paystack-signature") signature: string,
  ) {
    // 1. Verify the webhook signature using native crypto
    const secret = process.env.PAYSTACK_SECRET_KEY!;
    const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(body)).digest("hex");

    if (hash !== signature) {
      this.logger.warn("Invalid Paystack webhook signature");
      throw new BadRequestException("Invalid signature");
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
}