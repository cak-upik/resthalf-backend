import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { SearchDto } from "./dto/search.dto";

@ApiTags("Search")
@Controller("search")
export class SearchController {
  constructor(private searchSvc: SearchService) {}

  @ApiOperation({ summary: "Search hotel availability by city & date" })
  @Get()
  search(@Query() query: SearchDto) {
    return this.searchSvc.search({
      city: query.city,
      date: query.date,
      nights: query.nights,
      adults: query.adults,
      includeWholesale: query.includeWholesale,
    });
  }
}
