import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateVariantDto {
  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(1)
  priceCents!: number;

  @IsNumber()
  @Min(0)
  stockQty!: number;
}

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}