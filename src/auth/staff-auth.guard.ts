import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}
  
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new UnauthorizedException("No token");
    try {
      const payload = this.jwt.verify(token);
      if (payload.type !== "staff") throw new Error();
      req.staff = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
