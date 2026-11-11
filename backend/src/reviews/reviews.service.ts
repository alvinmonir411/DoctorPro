import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';
import { normalizePhoneDigits, phonesMatch } from '../common/utils/phone';
import {
  buildRatingSummary,
  formatPublicReview,
} from '../common/utils/ratings';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkEligibility(doctorIdOrSlug: string, phone: string) {
    if (!doctorIdOrSlug?.trim()) {
      throw new BadRequestException('doctorId is required.');
    }

    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [{ id: doctorIdOrSlug.trim() }, { slug: doctorIdOrSlug.trim() }],
      },
      select: { id: true, name: true, slug: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found.');
    }

    const cleanPhone = phone?.trim() || '';
    if (!normalizePhoneDigits(cleanPhone)) {
      return {
        doctorId: doctor.id,
        doctorName: doctor.name,
        eligible: false,
        reason: 'INVALID_PHONE',
        message: 'Please enter the phone number you used when booking.',
        completedVisits: [],
        reviewedVisits: [],
        pendingVisitCount: 0,
      };
    }

    const doctorAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: { not: 'CANCELLED' },
      },
      include: {
        patient: { select: { name: true, phone: true } },
        review: {
          select: { id: true, rating: true, comment: true, createdAt: true },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    const matched = doctorAppointments.filter((appt) =>
      phonesMatch(appt.patient?.phone, cleanPhone),
    );

    const completedUnreviewed = matched.filter(
      (appt) => appt.status === 'COMPLETED' && !appt.review,
    );
    const completedReviewed = matched.filter(
      (appt) => appt.status === 'COMPLETED' && Boolean(appt.review),
    );
    const nonCompleted = matched.filter((appt) => appt.status !== 'COMPLETED');

    let reason = 'NO_APPOINTMENT';
    let message =
      'No completed consultation was found for this phone number with this doctor.';

    if (completedUnreviewed.length > 0) {
      reason = 'ELIGIBLE';
      message =
        'Verified completed consultation found. You can rate and review this doctor below.';
    } else if (completedReviewed.length > 0) {
      reason = 'ALREADY_REVIEWED';
      message =
        'You have already submitted a review for your completed consultation(s) with this doctor.';
    } else if (nonCompleted.length > 0) {
      reason = 'VISIT_NOT_COMPLETED';
      message =
        'Your appointment must be marked as Completed after your visit before you can submit a review.';
    }

    return {
      doctorId: doctor.id,
      doctorName: doctor.name,
      eligible: completedUnreviewed.length > 0,
      reason,
      message,
      completedVisits: completedUnreviewed.map((appt) => ({
        appointmentId: appt.id,
        date: appt.date,
        timeSlot: appt.timeSlot,
        serialNumber: appt.serialNumber,
        patientName: appt.patient?.name || 'Patient',
      })),
      reviewedVisits: completedReviewed.map((appt) => ({
        appointmentId: appt.id,
        date: appt.date,
        timeSlot: appt.timeSlot,
        review: appt.review,
      })),
      pendingVisitCount: nonCompleted.length,
    };
  }

  async createReview(dto: CreateReviewDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId.trim() },
      include: {
        patient: true,
        doctor: { select: { id: true, slug: true, name: true } },
        review: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }

    const requestedDoc = dto.doctorId.trim();
    const matchesDoctor =
      appointment.doctorId === requestedDoc ||
      appointment.doctor?.slug === requestedDoc;
    if (!matchesDoctor) {
      throw new BadRequestException(
        'This appointment does not belong to the selected doctor.',
      );
    }

    if (!phonesMatch(appointment.patient?.phone, dto.phone)) {
      throw new BadRequestException(
        'The phone number provided does not match the booked appointment.',
      );
    }

    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Only patients whose consultation is marked as Completed can submit a review.',
      );
    }

    if (appointment.review) {
      throw new ConflictException(
        'A review has already been submitted for this appointment.',
      );
    }

    const trimmedComment = dto.comment.trim();
    if (trimmedComment.length < 3) {
      throw new BadRequestException(
        'Please write a short review (at least 3 characters).',
      );
    }

    try {
      const created = await this.prisma.doctorReview.create({
        data: {
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          patientName: appointment.patient?.name?.trim() || 'Verified Patient',
          rating: dto.rating,
          comment: trimmedComment,
          isVerified: true,
          isActive: true,
        },
        include: {
          appointment: { select: { date: true, timeSlot: true } },
        },
      });

      return formatPublicReview(created);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'A review has already been submitted for this appointment.',
        );
      }
      throw error;
    }
  }

  async getDoctorReviews(doctorIdOrSlug: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [{ id: doctorIdOrSlug }, { slug: doctorIdOrSlug }],
      },
      select: { id: true, name: true, slug: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found.');
    }

    const rows = await this.prisma.doctorReview.findMany({
      where: {
        doctorId: doctor.id,
        isActive: true,
      },
      include: {
        appointment: { select: { date: true, timeSlot: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = buildRatingSummary(rows);

    return {
      doctorId: doctor.id,
      doctorName: doctor.name,
      ...summary,
      reviews: rows.map(formatPublicReview),
    };
  }
}
