import { Body, Controller, Get, Put } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { TshirtsService } from './tshirts.service';

@Controller('tshirts')
export class TshirtsController {
  constructor(private readonly tshirtsService: TshirtsService) {}

  @Get('stock')
  findAll() {
    return this.tshirtsService.findAll();
  }

  @Put('stock')
  @Roles('admin')
  setQuantite(@Body() body: { taille: string; quantiteRecue: number }) {
    return this.tshirtsService.setQuantite(body.taille, Number(body.quantiteRecue));
  }
}