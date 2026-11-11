export interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface RatingSummary {
  averageRating: number;
  reviewCount: number;
  ratingBreakdown: RatingBreakdown;
}

export function buildRatingSummary(
  reviews: Array<{ rating: number }>,
): RatingSummary {
  const breakdown: RatingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const item of reviews) {
    const score = Math.min(5, Math.max(1, Math.round(Number(item.rating) || 0))) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    breakdown[score] += 1;
    sum += score;
  }

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0 ? Math.round((sum / reviewCount) * 10) / 10 : 0;

  return {
    averageRating,
    reviewCount,
    ratingBreakdown: breakdown,
  };
}

export function formatPublicReview(review: {
  id: string;
  doctorId: string;
  appointmentId: string;
  patientName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
  appointment?: { date: Date; timeSlot: string } | null;
}) {
  return {
    id: review.id,
    doctorId: review.doctorId,
    appointmentId: review.appointmentId,
    patientName: review.patientName,
    rating: review.rating,
    comment: review.comment,
    isVerified: review.isVerified,
    createdAt: review.createdAt,
    visitDate: review.appointment?.date ?? null,
    visitSlot: review.appointment?.timeSlot ?? null,
  };
}
