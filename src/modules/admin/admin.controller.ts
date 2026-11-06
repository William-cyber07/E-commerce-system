import { Body, Controller, Post, Delete, Param, Get, Patch, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AdminGuard } from "../../common/guards/admin.guard";
import { AdminService } from "./admin.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { OrderStatus } from "@prisma/client";

@Controller("admin")
@UseGuards(AuthGuard("jwt"), AdminGuard) // <-- Protects all routes in this controller
export class AdminController {
  constructor(private adminService: AdminService) {}

  // --- PRODUCTS ---
  @Post("products")
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Delete("products/:id")
  deleteProduct(@Param("id") id: string) {
    return this.adminService.deleteProduct(id);
  }

  // --- ORDERS ---
  @Get("orders")
  getAllOrders() {
    return this.adminService.getAllOrders();
  }

  @Patch("orders/:id/status")
  updateOrderStatus(@Param("id") id: string, @Body("status") status: OrderStatus) {
    return this.adminService.updateOrderStatus(id, status);
  }
}