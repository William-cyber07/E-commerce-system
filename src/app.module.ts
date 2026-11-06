import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CartModule } from "./modules/cart/cart.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { CheckoutModule } from "./modules/checkout/checkout.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";
import { ScheduleModule } from "@nestjs/schedule";
import { AdminModule } from "./modules/admin/admin.module";


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AdminModule,
    ScheduleModule.forRoot(),
    AuthModule,
    CatalogModule,
    CartModule,
    InventoryModule,
    OrdersModule,
    PaymentsModule,
    CheckoutModule,
    WebhooksModule,
  ],
})
export class AppModule {}