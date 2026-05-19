import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisModule as NestRedisModule } from "@nestjs-modules/ioredis";

// @Global() — makes @InjectRedis() available everywhere without re-importing
@Global()
@Module({
  imports: [
    NestRedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "single",
        url: config.get("REDIS_URL"),
      }),
    }),
  ],
  exports: [NestRedisModule],
})
export class RedisModule {}
