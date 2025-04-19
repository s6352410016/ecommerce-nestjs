import { ApiProperty } from "@nestjs/swagger";

export class CommonRes {
  @ApiProperty()
  status: string;
}