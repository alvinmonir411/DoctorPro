import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CreateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('eligible')
  checkEligibility(
    @Query('doctorId') doctorId: string,
    @Query('phone') phone: string,
  ) {
    return this.reviewsService.checkEligibility(doctorId, phone);
  }

  @Public()
  @Get('doctor/:doctorId')
  getDoctorReviews(@Param('doctorId') doctorId: string) {
    return this.reviewsService.getDoctorReviews(doctorId);
  }

  @Public()
  @Post()
  createReview(@Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(dto);
  }
}
