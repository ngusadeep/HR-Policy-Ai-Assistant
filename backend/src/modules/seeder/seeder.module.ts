import { Module } from '@nestjs/common';
import { SeederService } from 'src/modules/seeder/seeder.service';
import { RolesModule } from 'src/modules/roles/roles.module';
import { UsersModule } from 'src/modules/users/users.module';
import { LoggerModule } from 'src/lib/logger/logger.module';

@Module({
  imports: [RolesModule, UsersModule, LoggerModule],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
