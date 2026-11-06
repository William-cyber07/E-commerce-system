import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Paystack } from "@paystack/paystack-sdk";

@Injectable()
export class PaymentsService {
  private paystack: Paystack;

  constructor() {

    console.log("PAYSTACK KEY LOADED:", process.env.PAYSTACK_SECRET_KEY?.substring(0, 15) + "..."); 
    
    this.paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY!);
  }

  async initializeTransaction(
    amountCents: number, 
    email: string, 
    orderId: string, 
    cartId: string
  ): Promise<{ authorization_url: string; reference: string }> {
    try {
      const response = await this.paystack.transaction.initialize({
        amount: amountCents,
        email,
        // 👇 REPLACE THIS with your active ngrok URL
        callback_url: "https://customary-headlock-clinking.ngrok-free.dev/checkout/success", 
        metadata: JSON.stringify({ orderId, cartId }),
      });

      // 👇 ADD THIS: Check if Paystack actually returned a successful status
      if (!response || !response.status) {
        // Log the exact error Paystack sent back
        console.error("Paystack API Error:", response?.message); 
        throw new Error(response?.message || "Paystack initialization failed");
      }

      return response.data as any; 
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Paystack Init Error:", errorMessage);
      throw new InternalServerErrorException(
        errorMessage || "Failed to initialize payment"
      );
    }
  }
}