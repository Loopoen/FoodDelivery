import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import type {HeathCheckResponse} from "@FoodDelivery/types"


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  heath(): HeathCheckResponse{
    return{
      status:"ok",
       timestamps:new Date()
    }
  }

}
