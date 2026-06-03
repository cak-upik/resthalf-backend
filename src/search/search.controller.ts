import { Controller, Get, Query } from "@nestjs/common";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
  constructor(private searchSvc: SearchService) {}
  
  @Get()
  search(
    @Query("city") city: string,
    @Query("date") date: string,
    @Query("nights") nights = "1",
    @Query("adults") adults = "1",
    @Query("includeWholesale") wholesale = "true",
  ) {
    return this.searchSvc.search({
      city,
      date,
      nights: parseInt(nights),
      adults: parseInt(adults),
      includeWholesale: wholesale !== "false",
    });
  }
}
