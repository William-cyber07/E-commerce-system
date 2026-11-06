import { BadRequestException, Injectable } from "@nestjs/common";
import { CartService } from "../cart/cart.service";
import { InventoryService } from "../inventory/inventory.service";
import { OrdersService } from "../orders/orders.service";
import { PaymentsService } from "../payments/payments.service";
import { CheckoutDto } from "./dto/checkout.dto";

@Injectable()
export class CheckoutService {
  constructor(
    private cartService: CartService,
    private inventoryService: InventoryService,
    private ordersService: OrdersService,
    private paymentsService: PaymentsService
  ) {}

  async processCheckout(owner: { userId?: string; sessionId?: string }, dto: CheckoutDto) {
    // 1. Get the cart
    const cart = await this.cartService.getOrCreateCart(owner);
    if (!cart.items.length) throw new BadRequestException("Cart is empty");

    // 2. Compute totals
    const totals = this.cartService.computeTotals(cart);

    // 3. Reserve inventory for 15 minutes (throws if out of stock)
    await this.inventoryService.reserveStock(cart.id, cart.items);

    // 4. Create the pending order in the DB
    const order = await this.ordersService.createPendingOrder(cart, totals, dto.email, dto.shippingAddress);
    await this.ordersService.addOrderEvent(order.id, "order.created");

    // ... inside processCheckout

    // 5. Initialize Paystack Transaction
    const paystackData = await this.paymentsService.initializeTransaction(
      order.totalCents,
      order.email,
      order.id,
      cart.id
    );

    if (!paystackData || !paystackData.reference) {
      throw new BadRequestException("Failed to get payment reference from Paystack");
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
}