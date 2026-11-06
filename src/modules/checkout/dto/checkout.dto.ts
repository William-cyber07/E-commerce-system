import { IsEmail, IsObject, IsString } from "class-validator";

export class CheckoutDto {
  @IsEmail()
  email!: string;

  @IsObject()
  shippingAddress!: {
    line1: string;
    city: string;
    country: string;
    postalCode: string;
  };
}