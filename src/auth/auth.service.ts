import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Guest } from "../guests/guest.entity";
import { Staff } from "../staff/staff.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Guest) private guests: Repository<Guest>,
    @InjectRepository(Staff) private staff: Repository<Staff>,
    private jwt: JwtService,
  ) {}

  async registerGuest(data: {
    fullName: string;
    phone: string;
    email?: string;
    password: string;
  }) {
    if (await this.guests.findOne({ where: { phone: data.phone } }))
      throw new ConflictException("Phone already registered");
    const passwordHash = await bcrypt.hash(data.password, 12);
    const g = await this.guests.save(
      this.guests.create({ ...data, passwordHash }),
    );
    return {
      guest: this.safeGuest(g),
      token: this.jwt.sign({ sub: g.id, type: "guest" }),
    };
  }

  async loginGuest(phone: string, password: string) {
    const g = await this.guests.findOne({ where: { phone } });
    if (!g?.passwordHash || !(await bcrypt.compare(password, g.passwordHash)))
      throw new UnauthorizedException("Invalid credentials");
    return {
      guest: this.safeGuest(g),
      token: this.jwt.sign({ sub: g.id, type: "guest" }),
    };
  }

  async loginStaff(phone: string, password: string) {
    const s = await this.staff.findOne({ where: { phone, isActive: true } });
    if (!s?.passwordHash || !(await bcrypt.compare(password, s.passwordHash)))
      throw new UnauthorizedException("Invalid credentials");
    const token = this.jwt.sign({
      sub: s.id,
      hotelId: s.hotelId,
      phone: s.phone,
      role: s.role,
      type: "staff",
    });
    return {
      staff: {
        id: s.id,
        name: s.name,
        phone: s.phone,
        role: s.role,
        hotelId: s.hotelId,
      },
      token,
    };
  }
  
  private safeGuest(g: Guest) {
    const { passwordHash, ...safe } = g as any;
    return safe;
  }
}
