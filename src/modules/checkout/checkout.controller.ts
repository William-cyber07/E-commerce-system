import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { CheckoutService } from "./checkout.service";
import { CheckoutDto } from "./dto/checkout.dto";
import { OptionalAuthGuard } from "../../common/guards/optional-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("checkout")
export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  @UseGuards(OptionalAuthGuard)
  @Post()
  async checkout(
    @Body() dto: CheckoutDto,
    @Req() req: Request,
    @CurrentUser() user: any
  ) {
    const owner = user ? { userId: user.userId } : { sessionId: req.cookies["cart_session"] };
    if (!owner.userId && !owner.sessionId) throw new Error("No cart session found");
    
    return this.checkoutService.processCheckout(owner, dto);
  }
}