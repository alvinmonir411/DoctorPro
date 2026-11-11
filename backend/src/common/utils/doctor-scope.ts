import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ScopedRequestUser {
  sub?: string;
  userId?: string;
  email?: string;
  role?: string;
  doctorId?: string | null;
}

/**
 * Resolves the enforced doctorId for DOCTOR / DOCTOR_ASSISTANT accounts.
 * Returns undefined for ADMIN so clinic-wide records remain accessible.
 */
export async function resolveScopedDoctorId(
  prisma: PrismaService,
  user?: ScopedRequestUser,
): Promise<string | undefined> {
  const role = (user?.role || '').toUpperCase();
  if (role !== 'DOCTOR' && role !== 'DOCTOR_ASSISTANT') {
    return undefined;
  }

  if (user?.doctorId) {
    return user.doctorId;
  }

  const userId = user?.userId || user?.sub;
  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { doctorId: true },
    });
    if (dbUser?.doctorId) {
      return dbUser.doctorId;
    }
  }

  if (role === 'DOCTOR' && user?.email) {
    const matchedDoctor = await prisma.doctor.findFirst({
      where: { email: user.email },
      select: { id: true },
    });
    if (matchedDoctor?.id) {
      return matchedDoctor.id;
    }
  }

  throw new ForbiddenException('No doctor profile is linked to your account.');
}
