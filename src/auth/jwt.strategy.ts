import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get("JWT_SECRET"),
    });
  }
  
  // ★ No DB hit — validates payload structure only. Faster than hitting DB on each request.
  async validate(payload: any) {
    if (!payload.sub || !payload.type) throw new UnauthorizedException();
    return {
      id: payload.sub,
      phone: payload.phone,
      type: payload.type,
      hotelId: payload.hotelId,
      role: payload.role,
    };
  }
}
