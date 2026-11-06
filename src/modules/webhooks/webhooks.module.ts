import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { OrdersModule } from "../orders/orders.module";
import { InventoryModule } from "../inventory/inventory.module";

@Module({
  imports: [OrdersModule, InventoryModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}