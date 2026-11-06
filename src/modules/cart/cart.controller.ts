import { Body, Controller, Get, Post, Patch, Delete, Param, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { CartService } from "./cart.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

const SESSION_COOKIE = "cart_session";

@Controller("cart")
export class CartController {
  constructor(private cart: CartService) {}

  private owner(req: Request, res: Response, user: any) {
    if (user) return { userId: user.userId };
    let sid = req.cookies?.[SESSION_COOKIE];
    if (!sid) {
      sid = randomUUID();
      res.cookie(SESSION_COOKIE, sid, { httpOnly: true, sameSite: "lax", maxAge: 30 * 24 * 3600 * 1000 });
    }
    return { sessionId: sid };
  }

  @UseGuards(AuthGuard("jwt"))
  @Get()
  async get(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentUser() user: any) {
    const cart = await this.cart.getOrCreateCart(this.owner(req, res, user));
    return { cart, ...this.cart.computeTotals(cart) };
  }

  @Post("items")
  async add(@Body() body: { variantId: string; quantity: number },
            @Req() req: Request, @Res({ passthrough: true }) res: Response,
            @CurrentUser() user: any) {
    const cart = await this.cart.addItem(this.owner(req, res, user), body.variantId, body.quantity);
    return { cart, ...this.cart.computeTotals(cart) };
  }

  @Patch("items/:id")
  async update(@Param("id") id: string, @Body() body: { quantity: number },
               @Req() req: Request, @Res({ passthrough: true }) res: Response,
               @CurrentUser() user: any) {
    const cart = await this.cart.updateItem(this.owner(req, res, user), id, body.quantity);
    return { cart, ...this.cart.computeTotals(cart) };
  }

  @Delete("items/:id")
  async remove(@Param("id") id: string,
               @Req() req: Request, @Res({ passthrough: true }) res: Response,
               @CurrentUser() user: any) {
    const cart = await this.cart.removeItem(this.owner(req, res, user), id);
    return { cart, ...this.cart.computeTotals(cart) };
  }
}