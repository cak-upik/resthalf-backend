import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
// Custom modules
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
// Entities
import { Hotel } from "./hotels/hotel.entity";
import { Room } from "./rooms/room.entity";
import { Guest } from "./guests/guest.entity";
import { Staff } from "./staff/staff.entity";
import { Booking } from "./booking/booking.entity";
import { DelegationRecord } from "./delegation/delegation.entity";
import { AdmittedInterval } from "./psm/admitted-interval.entity";
import { TemporalLedger } from "./ledger/temporal-ledger.entity";
import { WholesaleBooking } from "./wholesale/wholesale-booking.entity";
import { ManualBooking } from "./manual-booking/manual-booking.entity";
import { StaffCommissionAccount } from "./manual-booking/staff-commission.entity";
import { CommissionPayoutRequest } from "./manual-booking/payout-request.entity";
// Services & Workers
import { PELService } from "./pel/pel.service";
import { PSMEngine } from "./psm/psm.engine";
import { DelegationService } from "./delegation/delegation.service";
import { ReconciliationService } from "./delegation/reconciliation.service";
import { ExpiryWorker } from "./delegation/expiry.worker";
import { LedgerService } from "./ledger/ledger.service";
import { BookingService } from "./booking/booking.service";
import { SearchService } from "./search/search.service";
import { PaymentService } from "./payment/payment.service";
import { WhatsAppService } from "./notifications/whatsapp.service";
import { DashboardService } from "./dashboard/dashboard.service";
import { DashboardGateway } from "./dashboard/dashboard.gateway";
import { TBOProvider } from "./wholesale/providers/tbo.provider";
import { HotelbedsProvider } from "./wholesale/providers/hotelbeds.provider";
import { WholesaleService } from "./wholesale/wholesale.service";
import { WholesaleBookingService } from "./wholesale/wholesale-booking.service";
import { WholesaleExpiryWorker } from "./wholesale/wholesale-expiry.worker";
import { VacateService } from "./vacate/vacate.service";
import { ManualBookingService } from "./manual-booking/manual-booking.service";
import { CancellationService } from "./cancellation/cancellation.service";
import { ExtendStayService } from "./booking/extend-stay.service";
import { RescheduleService } from "./reschedule/reschedule.service";
import { AppService } from "./app.service";
// Controllers
import { AppController } from "./app.controller";
import { BookingController } from "./booking/booking.controller";
import { SearchController } from "./search/search.controller";
import { PaymentController } from "./payment/payment.controller";
import { DashboardController } from "./dashboard/dashboard.controller";
import { VacateController } from "./vacate/vacate.controller";
import { MyBookingsController } from "./booking/my-bookings.controller";
import { ManualBookingController } from "./manual-booking/manual-booking.controller";
import { CommissionController } from "./commission/commission.controller";
import { CancellationController } from "./cancellation/cancellation.controller";
import { ExtendStayController } from "./booking/extend-stay.controller";
import { RescheduleController } from "./reschedule/reschedule.controller";
import { HotelsController } from "./hotels/hotels.controller";
import { RoomsController } from "./rooms/rooms.controller";
import { StaffController } from "./staff/staff.controller";
import { WholesaleCancelController } from "./wholesale/wholesale-cancel.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RedisModule,
    AuthModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: "postgres",
        url: cfg.get("DATABASE_URL"),
        synchronize: false,
        logging: true,
        entities: [
          Hotel,
          Room,
          Guest,
          Staff,
          Booking,
          DelegationRecord,
          AdmittedInterval,
          TemporalLedger,
          WholesaleBooking,
          ManualBooking,
          StaffCommissionAccount,
          CommissionPayoutRequest,
        ],
      }),
    }),
    TypeOrmModule.forFeature([
      Hotel,
      Room,
      Guest,
      Staff,
      Booking,
      DelegationRecord,
      AdmittedInterval,
      TemporalLedger,
      WholesaleBooking,
      ManualBooking,
      StaffCommissionAccount,
      CommissionPayoutRequest,
    ]),
  ],
  controllers: [
    AppController,
    BookingController,
    SearchController,
    PaymentController,
    DashboardController,
    VacateController,
    MyBookingsController,
    ManualBookingController,
    CommissionController,
    CancellationController,
    ExtendStayController,
    RescheduleController,
    HotelsController,
    RoomsController,
    StaffController,
    WholesaleCancelController,
    // AuthController is registered inside AuthModule
  ],
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  providers: [
    AppService,
    PELService,
    PSMEngine,
    DelegationService,
    ReconciliationService,
    ExpiryWorker,
    LedgerService,
    BookingService,
    SearchService,
    PaymentService,
    WhatsAppService,
    DashboardService,
    DashboardGateway,
    TBOProvider,
    HotelbedsProvider,
    WholesaleService,
    WholesaleBookingService,
    WholesaleExpiryWorker,
    VacateService,
    ManualBookingService,
    CancellationService,
    ExtendStayService,
    RescheduleService,
  ],
})
export class AppModule {}
