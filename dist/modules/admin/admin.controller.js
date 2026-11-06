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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const admin_guard_1 = require("../../common/guards/admin.guard");
const admin_service_1 = require("./admin.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const client_1 = require("@prisma/client");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    // --- PRODUCTS ---
    createProduct(dto) {
        return this.adminService.createProduct(dto);
    }
    deleteProduct(id) {
        return this.adminService.deleteProduct(id);
    }
    // --- ORDERS ---
    getAllOrders() {
        return this.adminService.getAllOrders();
    }
    updateOrderStatus(id, status) {
        return this.adminService.updateOrderStatus(id, status);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)("products"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Delete)("products/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Get)("orders"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllOrders", null);
__decorate([
    (0, common_1.Patch)("orders/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateOrderStatus", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)("admin"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), admin_guard_1.AdminGuard) // <-- Protects all routes in this controller
    ,
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
