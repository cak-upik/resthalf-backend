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
      // JWT signs the id as `sub`; expose it as `id` so controllers can read
      // req.staff.id (matches the guest JwtStrategy convention).
      req.staff = { ...payload, id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
