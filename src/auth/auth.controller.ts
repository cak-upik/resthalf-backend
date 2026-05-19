import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("guest/register")
  register(
    @Body()
    b: {
      fullName: string;
      phone: string;
      email?: string;
      password: string;
    },
  ) {
    return this.auth.registerGuest(b);
  }

  @Post("guest/login")
  loginGuest(@Body() b: { phone: string; password: string }) {
    return this.auth.loginGuest(b.phone, b.password);
  }
  
  @Post("staff/login")
  loginStaff(@Body() b: { phone: string; password: string }) {
    return this.auth.loginStaff(b.phone, b.password);
  }
}
