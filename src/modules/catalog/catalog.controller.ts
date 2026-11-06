import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Get("products")
  list(@Query("search") search?: string, @Query("category") category?: string,
       @Query("limit") limit?: string, @Query("offset") offset?: string) {
    return this.catalog.listProducts({
      search,
      category,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get("products/:slug")
  detail(@Param("slug") slug: string) {
    return this.catalog.getProductBySlug(slug);
  }

  @Get("categories")
  categories() {
    return this.catalog.listCategories();
  }
}