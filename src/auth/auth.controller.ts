import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterGuestDto } from "./dto/register-guest.dto";
import { LoginDto } from "./dto/login.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @ApiOperation({ summary: "Register a new guest and receive a JWT" })
  @Post("guest/register")
  register(@Body() b: RegisterGuestDto) {
    return this.auth.registerGuest(b);
  }

  @ApiOperation({ summary: "Log in as a guest" })
  @HttpCode(HttpStatus.OK)
  @Post("guest/login")
  loginGuest(@Body() b: LoginDto) {
    return this.auth.loginGuest(b.phone, b.password);
  }

  @ApiOperation({ summary: "Log in as staff (receptionist / manager)" })
  @HttpCode(HttpStatus.OK)
  @Post("staff/login")
  loginStaff(@Body() b: LoginDto) {
    return this.auth.loginStaff(b.phone, b.password);
  }
}
