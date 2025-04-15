import { ApiProperty } from "@nestjs/swagger";

export class CheckOutSessionRes {
  @ApiProperty({
    type: String,
  })
  url: string | null;
}