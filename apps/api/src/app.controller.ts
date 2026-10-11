import { Controller, Get, Inject } from '@nestjs/common'
import { AppService } from './app.service.js';
import type {HealthCheckResponse} from "@FoodDelivery/types"

import  * as schema from "./db/schema/index.js"
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';


@Controller()
export class AppController {
  constructor(@Inject('DB') private db: NeonHttpDatabase<typeof schema>){} 

  @Get ('db-test')
  async dbTest(){
    const result = await this.db.select().from(schema.users)
    console.log("hhe",result.length)
    return {users:result, count:result.length}
  }


  @Get('health')
  heath(): HealthCheckResponse{
    return{
      status:"ok",
       timestamp:new Date()
    }
  }

}
