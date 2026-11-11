import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as webpush from 'web-push';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubscribePushDto,
  UnsubscribePushDto,
  UpdateEmailConfigDto,
} from './dto/notification.dto';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  urgent?: boolean;
}

interface ResolvedEmailConfig {
  provider: 'resend' | 'smtp' | 'none';
  configuredMode: 'auto' | 'resend' | 'smtp';
  resendApiKey: string;
  resendFrom: string;
  replyTo?: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  usingCustomDoctorConfig?: boolean;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidReady = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject =
      process.env.VAPID_SUBJECT || 'mailto:notifications@doctorpro.local';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidReady = true;
      this.logger.log('Web Push VAPID keys configured cleanly.');
    } else {
      this.logger.warn(
        'VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY missing in environment; Web Push disabled.',
      );
    }
  }

  getVapidPublicKey() {
    const publicKey = process.env.VAPID_PUBLIC_KEY || '';
    return {
      enabled: this.vapidReady && Boolean(publicKey),
      publicKey,
    };
  }

  // ─── Push Subscriptions ──────────────────────────────────────────────

  async subscribePush(dto: SubscribePushDto) {
    const endpoint = dto.subscription?.endpoint?.trim();
    const p256dh = dto.subscription?.keys?.p256dh?.trim();
    const auth = dto.subscription?.keys?.auth?.trim();

    if (!endpoint || !p256dh || !auth) {
      throw new BadRequestException('Invalid Web Push subscription payload.');
    }

    let doctorId = dto.doctorId || null;
    let patientPhone = dto.patientPhone?.trim() || null;
    let serialNumber =
      typeof dto.serialNumber === 'number' ? dto.serialNumber : null;
    let doctorName = 'your doctor';

    if (dto.appointmentId) {
      const appt = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
        include: { doctor: true, patient: true },
      });
      if (appt) {
        doctorId = appt.doctorId;
        patientPhone = appt.patient?.phone || patientPhone;
        serialNumber = appt.serialNumber ?? serialNumber;
        doctorName = appt.doctor?.name ? `Dr. ${appt.doctor.name}` : doctorName;
      }
    } else if (doctorId) {
      const doc = await this.prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { name: true },
      });
      if (doc?.name) doctorName = `Dr. ${doc.name}`;
    }

    const record = await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh,
        auth,
        appointmentId: dto.appointmentId || null,
        doctorId,
        patientPhone,
        serialNumber,
        userAgent: dto.userAgent || null,
        lastNotifiedSerial: 0,
      },
      create: {
        endpoint,
        p256dh,
        auth,
        appointmentId: dto.appointmentId || null,
        doctorId,
        patientPhone,
        serialNumber,
        userAgent: dto.userAgent || null,
      },
    });

    const targetUrl = `/live-queue${
      dto.appointmentId || doctorId || patientPhone
        ? `?${new URLSearchParams({
            ...(doctorId ? { doctorId } : {}),
            ...(dto.appointmentId ? { appointmentId: dto.appointmentId } : {}),
            ...(patientPhone ? { phone: patientPhone } : {}),
          }).toString()}`
        : ''
    }`;

    const welcomePayload: PushPayload = {
      title: 'Turn Alerts Enabled — DoctorPro',
      body: serialNumber
        ? `You'll receive a browser alert before Serial #${serialNumber} is called by ${doctorName}.`
        : `You'll receive live queue alerts on this device from ${doctorName}.`,
      url: targetUrl,
      tag: `doctorpro-sub-${dto.appointmentId || doctorId || 'live'}`,
    };

    const testPushSent = await this.sendPushToSubscription(
      record,
      welcomePayload,
    );

    return {
      subscribed: true,
      id: record.id,
      appointmentId: record.appointmentId,
      doctorId: record.doctorId,
      serialNumber: record.serialNumber,
      testPushSent,
    };
  }

  async unsubscribePush(dto: UnsubscribePushDto) {
    if (!dto.endpoint) {
      throw new BadRequestException('Subscription endpoint is required.');
    }
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint: dto.endpoint.trim() },
    });
    return { subscribed: false };
  }

  async getPushStatus(params: {
    endpoint?: string;
    appointmentId?: string;
    doctorId?: string;
    serialNumber?: number;
  }) {
    if (!params.endpoint) return { subscribed: false };
    const sub = await this.prisma.pushSubscription.findUnique({
      where: { endpoint: params.endpoint.trim() },
    });
    if (!sub) return { subscribed: false };

    if (params.appointmentId && sub.appointmentId === params.appointmentId) {
      return { subscribed: true, serialNumber: sub.serialNumber };
    }
    if (
      params.doctorId &&
      sub.doctorId === params.doctorId &&
      (params.serialNumber === undefined || sub.serialNumber === params.serialNumber)
    ) {
      return { subscribed: true, serialNumber: sub.serialNumber };
    }
    return { subscribed: false };
  }

  async sendPushToSubscription(sub: any, payload: PushPayload): Promise<boolean> {
    if (!this.vapidReady) return false;
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload),
        { TTL: 3600 },
      );
      return true;
    } catch (err: any) {
      const statusCode = err?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await this.prisma.pushSubscription
          .delete({ where: { id: sub.id } })
          .catch(() => {});
      } else {
        this.logger.warn(
          `Push delivery failed (${statusCode || 'unknown'}): ${err?.message}`,
        );
      }
      return false;
    }
  }

  // ─── Queue Turn Alert Engine ─────────────────────────────────────────

  async notifyQueueTurnUpdates(
    doctor: { id: string; name: string; slotDuration?: number | null },
    currentServingSerial: number,
    chamberStatus = 'ACTIVE',
  ) {
    if (!this.vapidReady || !doctor?.id) return;

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const appointmentsToday = await this.prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED', 'SERVING'] },
      },
      include: { patient: true },
      orderBy: [{ serialNumber: 'asc' }, { timeSlot: 'asc' }],
    });

    const apptById = new Map<string, any>();
    const apptByPhone = new Map<string, any>();
    for (const appt of appointmentsToday) {
      apptById.set(appt.id, appt);
      if (appt.patient?.phone) {
        apptByPhone.set(appt.patient.phone.trim(), appt);
      }
    }

    const apptIds = appointmentsToday.map((a) => a.id);
    const subs = await this.prisma.pushSubscription.findMany({
      where: {
        OR: [
          ...(apptIds.length > 0 ? [{ appointmentId: { in: apptIds } }] : []),
          { doctorId: doctor.id },
        ],
      },
    });

    const slotDuration =
      doctor.slotDuration && doctor.slotDuration > 0 ? doctor.slotDuration : 15;

    for (const sub of subs) {
      const matchedAppt = sub.appointmentId
        ? apptById.get(sub.appointmentId) || null
        : sub.patientPhone
        ? apptByPhone.get(sub.patientPhone.trim()) || null
        : null;

      // Never send queue-turn reminders for completed/cancelled/inactive appointments
      if (sub.appointmentId && !matchedAppt) continue;

      const targetSerial = matchedAppt?.serialNumber ?? sub.serialNumber;
      if (!targetSerial || targetSerial <= 0) continue;

      if (chamberStatus === 'ACTIVE' && sub.lastNotifiedSerial === currentServingSerial) {
        continue;
      }

      const ahead = matchedAppt
        ? appointmentsToday.filter((a) => {
            const s = a.serialNumber || 0;
            if (s <= 0 || s >= targetSerial) return false;
            return currentServingSerial > 0
              ? a.status === 'SERVING' || s >= currentServingSerial
              : true;
          }).length
        : Math.max(0, targetSerial - currentServingSerial);
      if (ahead < 0 || ahead > 3) continue;

      const query = new URLSearchParams({ doctorId: doctor.id });
      if (matchedAppt?.id || sub.appointmentId) {
        query.set('appointmentId', matchedAppt?.id || sub.appointmentId);
      }
      if (matchedAppt?.patient?.phone || sub.patientPhone) {
        query.set('phone', matchedAppt?.patient?.phone || sub.patientPhone);
      }
      const targetUrl = `/live-queue?${query.toString()}`;

      let payload: PushPayload | null = null;

      if (chamberStatus === 'BREAK') {
        payload = {
          title: `Chamber on Short Break — Dr. ${doctor.name}`,
          body: `Currently paused at Serial #${currentServingSerial}. Your serial #${targetSerial} will resume shortly.`,
          url: targetUrl,
          tag: `doctorpro-turn-${sub.id}`,
        };
      } else if (ahead === 0) {
        payload = {
          title: `Your Turn Now! — Dr. ${doctor.name}`,
          body: `Serial #${targetSerial} is now being called into the consultation room. Please enter now.`,
          url: targetUrl,
          tag: `doctorpro-turn-${sub.id}`,
          urgent: true,
        };
      } else {
        const estMinutes = ahead * slotDuration;
        payload = {
          title:
            ahead === 1
              ? `You Are NEXT! (#${targetSerial}) — Dr. ${doctor.name}`
              : `Almost Your Turn (#${targetSerial}) — Dr. ${doctor.name}`,
          body: `Serial #${currentServingSerial} is serving now — your turn (#${targetSerial}) is in ~${estMinutes} mins.`,
          url: targetUrl,
          tag: `doctorpro-turn-${sub.id}`,
          urgent: ahead === 1,
        };
      }

      if (payload) {
        const ok = await this.sendPushToSubscription(sub, payload);
        if (ok && chamberStatus === 'ACTIVE') {
          await this.prisma.pushSubscription
            .update({
              where: { id: sub.id },
              data: { lastNotifiedSerial: currentServingSerial },
            })
            .catch(() => {});
        }
      }
    }
  }

  // ─── Appointment Lifecycle Notifications (Email + Push) ──────────────

  async notifyBookingConfirmation(appointment: any) {
    if (!appointment) return;

    const dateStr = this.formatDate(appointment.date);
    const doctorName = appointment.doctor?.name
      ? `Dr. ${appointment.doctor.name}`
      : 'your doctor';

    if (appointment.patient?.email) {
      const subject =
        appointment.status === 'CONFIRMED'
          ? `Appointment Confirmed (Serial #${appointment.serialNumber || 1}) — DoctorPro`
          : `Appointment Request Received (Serial #${appointment.serialNumber || 1}) — DoctorPro`;

      const html = this.buildAppointmentEmailHtml({
        heading:
          appointment.status === 'CONFIRMED'
            ? 'Your Appointment Is Confirmed'
            : 'Appointment Request Received',
        intro:
          appointment.status === 'CONFIRMED'
            ? `Thank you for booking with DoctorPro. Your visit with ${doctorName} is confirmed.`
            : `We have received your request with ${doctorName}. Our clinic desk will confirm shortly.`,
        patientName: appointment.patient?.name || 'Patient',
        doctorName,
        specialization: appointment.doctor?.specialization || 'Specialist',
        dateStr,
        timeSlot: appointment.timeSlot,
        serialNumber: appointment.serialNumber || 1,
        status: appointment.status,
        liveQueueUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/live-queue?doctorId=${encodeURIComponent(appointment.doctorId)}&appointmentId=${appointment.id}&phone=${encodeURIComponent(appointment.patient?.phone || '')}`,
      });

      await this.sendEmail({
        to: appointment.patient.email,
        subject,
        html,
        doctorId: appointment.doctorId,
        replyTo: appointment.doctor?.email || undefined,
      }).catch((err) =>
        this.logger.warn(`Booking email skipped/failed: ${err?.message}`),
      );
    }
  }

  async notifyAppointmentStatusChange(
    appointment: any,
    previousStatus?: string,
    skipPush = false,
  ) {
    if (!appointment || appointment.status === previousStatus) return;

    const doctorName = appointment.doctor?.name
      ? `Dr. ${appointment.doctor.name}`
      : 'your doctor';
    const serial = appointment.serialNumber || 1;
    const dateStr = this.formatDate(appointment.date);
    const targetUrl = `/live-queue?doctorId=${encodeURIComponent(appointment.doctorId)}&appointmentId=${appointment.id}&phone=${encodeURIComponent(appointment.patient?.phone || '')}`;

    // 1. Web Push to subscribed devices
    const subs = skipPush
      ? []
      : await this.prisma.pushSubscription.findMany({
          where: {
            OR: [
              { appointmentId: appointment.id },
              ...(appointment.patient?.phone
                ? [
                    {
                      doctorId: appointment.doctorId,
                      patientPhone: appointment.patient.phone,
                    },
                  ]
                : []),
            ],
          },
        });

    let pushTitle = `Appointment Update — DoctorPro`;
    let pushBody = `Your appointment (#${serial}) with ${doctorName} is now ${appointment.status}.`;
    let urgent = false;

    if (appointment.status === 'CONFIRMED') {
      pushTitle = `Appointment Confirmed! (#${serial})`;
      pushBody = `${doctorName} confirmed your booking for ${dateStr} (${appointment.timeSlot}).`;
    } else if (appointment.status === 'SERVING') {
      pushTitle = `Your Turn Now! — ${doctorName}`;
      pushBody = `Serial #${serial} is now serving in the consultation room. Please enter now.`;
      urgent = true;
    } else if (appointment.status === 'CANCELLED') {
      pushTitle = `Appointment Cancelled (#${serial})`;
      pushBody = `Your appointment with ${doctorName} on ${dateStr} has been cancelled.`;
    } else if (appointment.status === 'ABSENT') {
      pushTitle = `Missed Turn / Marked Absent (#${serial})`;
      pushBody = `You were marked as Absent for your appointment with ${doctorName} on ${dateStr}. Please contact the clinic desk to reschedule.`;
    } else if (appointment.status === 'COMPLETED') {
      pushTitle = `Visit Completed — DoctorPro`;
      pushBody = `Thank you for visiting ${doctorName}. Wishing you a speedy recovery!`;
    }

    for (const sub of subs) {
      await this.sendPushToSubscription(sub, {
        title: pushTitle,
        body: pushBody,
        url: targetUrl,
        tag: `doctorpro-status-${appointment.id}`,
        urgent,
      });
    }

    // 2. Email update if patient provided email
    if (appointment.patient?.email) {
      const html = this.buildAppointmentEmailHtml({
        heading: pushTitle,
        intro: pushBody,
        patientName: appointment.patient?.name || 'Patient',
        doctorName,
        specialization: appointment.doctor?.specialization || 'Specialist',
        dateStr,
        timeSlot: appointment.timeSlot,
        serialNumber: serial,
        status: appointment.status,
        liveQueueUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}${targetUrl}`,
      });

      await this.sendEmail({
        to: appointment.patient.email,
        subject: `${pushTitle} — DoctorPro`,
        html,
        doctorId: appointment.doctorId,
        replyTo: appointment.doctor?.email || undefined,
      }).catch((err) =>
        this.logger.warn(`Status email skipped/failed: ${err?.message}`),
      );
    }
  }

  // ─── Scheduled Pre-Appointment Reminders (24h & 2h Cron) ──────────────

  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendUpcomingReminders() {
    const now = new Date();
    const horizon = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const startDay = new Date(now);
    startDay.setHours(0, 0, 0, 0);

    const upcoming = await this.prisma.appointment.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        date: { gte: startDay, lte: horizon },
        OR: [{ reminder24hSent: false }, { reminder2hSent: false }],
      },
      include: {
        doctor: true,
        patient: true,
        pushSubscriptions: true,
      },
    });

    for (const appt of upcoming) {
      const apptTime = this.combineDateAndSlot(appt.date, appt.timeSlot);
      const diffHours = (apptTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 0) continue;

      const doctorName = appt.doctor?.name
        ? `Dr. ${appt.doctor.name}`
        : 'your doctor';
      const dateStr = this.formatDate(appt.date);
      const targetUrl = `/live-queue?doctorId=${encodeURIComponent(appt.doctorId)}&appointmentId=${appt.id}&phone=${encodeURIComponent(appt.patient?.phone || '')}`;

      // 2-hour urgent reminder
      if (diffHours <= 2.25 && !appt.reminder2hSent) {
        await this.deliverReminder(appt, {
          title: `Reminder: Appointment in ~2 Hours (#${appt.serialNumber || 1})`,
          body: `Your consultation with ${doctorName} starts at ${appt.timeSlot} today. Arrive 10 minutes early.`,
          doctorName,
          dateStr,
          targetUrl,
        });
        await this.prisma.appointment
          .update({
            where: { id: appt.id },
            data: { reminder2hSent: true, reminder24hSent: true },
          })
          .catch(() => {});
      } else if (diffHours > 2.25 && diffHours <= 24.5 && !appt.reminder24hSent) {
        // 24-hour reminder
        await this.deliverReminder(appt, {
          title: `Upcoming Appointment Reminder (#${appt.serialNumber || 1})`,
          body: `Reminder: You have an appointment with ${doctorName} on ${dateStr} (${appt.timeSlot}).`,
          doctorName,
          dateStr,
          targetUrl,
        });
        await this.prisma.appointment
          .update({
            where: { id: appt.id },
            data: { reminder24hSent: true },
          })
          .catch(() => {});
      }
    }
  }

  private async deliverReminder(
    appt: any,
    info: {
      title: string;
      body: string;
      doctorName: string;
      dateStr: string;
      targetUrl: string;
    },
  ) {
    for (const sub of appt.pushSubscriptions || []) {
      await this.sendPushToSubscription(sub, {
        title: info.title,
        body: info.body,
        url: info.targetUrl,
        tag: `doctorpro-reminder-${appt.id}`,
      });
    }

    if (appt.patient?.email) {
      const html = this.buildAppointmentEmailHtml({
        heading: info.title,
        intro: info.body,
        patientName: appt.patient?.name || 'Patient',
        doctorName: info.doctorName,
        specialization: appt.doctor?.specialization || 'Specialist',
        dateStr: info.dateStr,
        timeSlot: appt.timeSlot,
        serialNumber: appt.serialNumber || 1,
        status: appt.status,
        liveQueueUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}${info.targetUrl}`,
      });

      await this.sendEmail({
        to: appt.patient.email,
        subject: `${info.title} — DoctorPro`,
        html,
        doctorId: appt.doctorId,
        replyTo: appt.doctor?.email || undefined,
      }).catch((err) =>
        this.logger.warn(`Reminder email failed: ${err?.message}`),
      );
    }
  }

  // ─── Email Configuration (Clinic Admin & Per-Doctor) & Sender ────────

  private async resolveClinicEmailConfig(): Promise<ResolvedEmailConfig> {
    const secretRows = await this.prisma.settings.findMany({
      where: { group: 'secret' },
    });
    const map: Record<string, string> = {};
    for (const r of secretRows) map[r.key] = r.value;

    const configuredMode = (map.email_provider ||
      process.env.EMAIL_PROVIDER ||
      'auto') as 'auto' | 'resend' | 'smtp';

    const resendApiKey =
      map.email_resend_api_key || process.env.RESEND_API_KEY || '';
    const resendFrom =
      map.email_resend_from ||
      process.env.RESEND_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      'DoctorPro Clinic <onboarding@resend.dev>';

    const smtpUser = map.email_smtp_user || process.env.SMTP_USER || '';
    const smtpPass = map.email_smtp_pass || process.env.SMTP_PASS || '';
    const defaultHost = smtpUser.toLowerCase().endsWith('@gmail.com')
      ? 'smtp.gmail.com'
      : '';
    const smtpHost =
      map.email_smtp_host || process.env.SMTP_HOST || defaultHost;
    const smtpPort = Number(
      map.email_smtp_port ||
        process.env.SMTP_PORT ||
        (smtpHost === 'smtp.gmail.com' ? 465 : 587),
    );
    const smtpFrom =
      map.email_smtp_from ||
      process.env.SMTP_FROM_EMAIL ||
      (smtpUser ? `DoctorPro Clinic <${smtpUser}>` : '');

    let provider: 'resend' | 'smtp' | 'none' = 'none';
    if (configuredMode === 'resend' && resendApiKey) {
      provider = 'resend';
    } else if (configuredMode === 'smtp' && smtpHost && smtpUser && smtpPass) {
      provider = 'smtp';
    } else if (configuredMode === 'auto') {
      if (resendApiKey) provider = 'resend';
      else if (smtpHost && smtpUser && smtpPass) provider = 'smtp';
    }

    return {
      provider,
      configuredMode,
      resendApiKey,
      resendFrom,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpFrom,
      usingCustomDoctorConfig: false,
    };
  }

  private async resolveEmailConfig(
    doctorId?: string,
  ): Promise<ResolvedEmailConfig> {
    const clinicCfg = await this.resolveClinicEmailConfig();
    if (!doctorId) return clinicCfg;

    const [doctor, docCfg] = await Promise.all([
      this.prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { name: true, email: true },
      }),
      this.prisma.doctorEmailConfig.findUnique({
        where: { doctorId },
      }),
    ]);

    const replyTo =
      docCfg?.replyToEmail?.trim() || doctor?.email?.trim() || undefined;

    if (!docCfg) {
      return {
        ...clinicCfg,
        replyTo,
        usingCustomDoctorConfig: false,
      };
    }

    const docMode = (docCfg.provider || 'auto') as 'auto' | 'resend' | 'smtp';
    const docResendKey = docCfg.resendApiKey?.trim() || '';
    const docSmtpUser = docCfg.smtpUser?.trim() || '';
    const docSmtpPass = docCfg.smtpPass?.trim() || '';
    const docSmtpHost =
      docCfg.smtpHost?.trim() ||
      (docSmtpUser.toLowerCase().endsWith('@gmail.com') ? 'smtp.gmail.com' : '');
    const docSmtpPort = Number(
      docCfg.smtpPort || (docSmtpHost === 'smtp.gmail.com' ? 465 : 587),
    );

    const hasDocResend = Boolean(docResendKey);
    const hasDocSmtp = Boolean(docSmtpHost && docSmtpUser && docSmtpPass);

    let useDocProvider: 'resend' | 'smtp' | 'none' = 'none';
    if (docMode === 'resend' && hasDocResend) useDocProvider = 'resend';
    else if (docMode === 'smtp' && hasDocSmtp) useDocProvider = 'smtp';
    else if (docMode === 'auto') {
      if (hasDocResend) useDocProvider = 'resend';
      else if (hasDocSmtp) useDocProvider = 'smtp';
    }

    if (useDocProvider === 'none') {
      return {
        ...clinicCfg,
        replyTo,
        usingCustomDoctorConfig: false,
      };
    }

    const defaultDocResendFrom = doctor?.name
      ? `Dr. ${doctor.name} <onboarding@resend.dev>`
      : clinicCfg.resendFrom;

    return {
      provider: useDocProvider,
      configuredMode: docMode,
      resendApiKey: docResendKey,
      resendFrom: docCfg.resendFrom?.trim() || defaultDocResendFrom,
      replyTo,
      smtpHost: docSmtpHost,
      smtpPort: docSmtpPort,
      smtpUser: docSmtpUser,
      smtpPass: docSmtpPass,
      smtpFrom:
        docCfg.smtpFrom?.trim() ||
        (docSmtpUser
          ? `Dr. ${doctor?.name || 'Doctor'} <${docSmtpUser}>`
          : ''),
      usingCustomDoctorConfig: true,
    };
  }

  async getAdminEmailConfig() {
    const cfg = await this.resolveClinicEmailConfig();
    return {
      activeProvider: cfg.provider,
      configuredMode: cfg.configuredMode,
      hasResendKey: Boolean(cfg.resendApiKey),
      resendKeyPreview: cfg.resendApiKey
        ? `${cfg.resendApiKey.slice(0, 6)}••••${cfg.resendApiKey.slice(-4)}`
        : '',
      resendFrom: cfg.resendFrom,
      smtpHost: cfg.smtpHost,
      smtpPort: String(cfg.smtpPort || 465),
      smtpUser: cfg.smtpUser,
      hasSmtpPass: Boolean(cfg.smtpPass),
      smtpFrom: cfg.smtpFrom,
    };
  }

  async updateAdminEmailConfig(dto: UpdateEmailConfigDto) {
    const entries: { key: string; value: string | undefined }[] = [
      { key: 'email_provider', value: dto.provider },
      { key: 'email_resend_from', value: dto.resendFrom },
      { key: 'email_smtp_host', value: dto.smtpHost },
      { key: 'email_smtp_port', value: dto.smtpPort },
      { key: 'email_smtp_user', value: dto.smtpUser },
      { key: 'email_smtp_from', value: dto.smtpFrom },
    ];

    if (dto.resendApiKey && dto.resendApiKey.trim()) {
      entries.push({
        key: 'email_resend_api_key',
        value: dto.resendApiKey.trim(),
      });
    }
    if (dto.smtpPass && dto.smtpPass.trim()) {
      entries.push({
        key: 'email_smtp_pass',
        value: dto.smtpPass.replace(/\s+/g, ''),
      });
    }

    for (const item of entries) {
      if (item.value === undefined) continue;
      await this.prisma.settings.upsert({
        where: { key: item.key },
        update: { value: item.value.trim(), group: 'secret' },
        create: { key: item.key, value: item.value.trim(), group: 'secret' },
      });
    }

    return this.getAdminEmailConfig();
  }

  async getDoctorEmailConfig(doctorId: string) {
    const [doctor, docCfg, clinicCfg, resolved] = await Promise.all([
      this.prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { id: true, name: true, email: true },
      }),
      this.prisma.doctorEmailConfig.findUnique({
        where: { doctorId },
      }),
      this.resolveClinicEmailConfig(),
      this.resolveEmailConfig(doctorId),
    ]);

    return {
      doctorId,
      doctorName: doctor?.name || '',
      doctorEmail: doctor?.email || '',
      usingCustomConfig: Boolean(resolved.usingCustomDoctorConfig),
      activeProvider: resolved.provider,
      clinicFallbackProvider: clinicCfg.provider,
      configuredMode: docCfg?.provider || 'auto',
      hasResendKey: Boolean(docCfg?.resendApiKey),
      resendKeyPreview: docCfg?.resendApiKey
        ? `${docCfg.resendApiKey.slice(0, 6)}••••${docCfg.resendApiKey.slice(-4)}`
        : '',
      resendFrom: docCfg?.resendFrom || '',
      replyToEmail: docCfg?.replyToEmail || doctor?.email || '',
      smtpHost: docCfg?.smtpHost || 'smtp.gmail.com',
      smtpPort: docCfg?.smtpPort || '465',
      smtpUser: docCfg?.smtpUser || '',
      hasSmtpPass: Boolean(docCfg?.smtpPass),
      smtpFrom: docCfg?.smtpFrom || '',
    };
  }

  async updateDoctorEmailConfig(doctorId: string, dto: UpdateEmailConfigDto) {
    if (dto.clearCustomConfig) {
      await this.prisma.doctorEmailConfig.deleteMany({ where: { doctorId } });
      return this.getDoctorEmailConfig(doctorId);
    }

    const existing = await this.prisma.doctorEmailConfig.findUnique({
      where: { doctorId },
    });

    const data: any = {
      provider: dto.provider || existing?.provider || 'auto',
      resendFrom:
        dto.resendFrom !== undefined
          ? dto.resendFrom.trim() || null
          : existing?.resendFrom ?? null,
      replyToEmail:
        dto.replyToEmail !== undefined
          ? dto.replyToEmail.trim() || null
          : existing?.replyToEmail ?? null,
      smtpHost:
        dto.smtpHost !== undefined
          ? dto.smtpHost.trim() || null
          : existing?.smtpHost ?? null,
      smtpPort:
        dto.smtpPort !== undefined
          ? dto.smtpPort.trim() || null
          : existing?.smtpPort ?? null,
      smtpUser:
        dto.smtpUser !== undefined
          ? dto.smtpUser.trim() || null
          : existing?.smtpUser ?? null,
      smtpFrom:
        dto.smtpFrom !== undefined
          ? dto.smtpFrom.trim() || null
          : existing?.smtpFrom ?? null,
    };

    if (dto.resendApiKey && dto.resendApiKey.trim()) {
      data.resendApiKey = dto.resendApiKey.trim();
    }
    if (dto.smtpPass && dto.smtpPass.trim()) {
      data.smtpPass = dto.smtpPass.replace(/\s+/g, '');
    }

    await this.prisma.doctorEmailConfig.upsert({
      where: { doctorId },
      update: data,
      create: { doctorId, ...data },
    });

    return this.getDoctorEmailConfig(doctorId);
  }

  async sendDoctorTestEmail(doctorId: string, to: string) {
    const cfg = await this.resolveEmailConfig(doctorId);
    if (cfg.provider === 'none') {
      throw new BadRequestException(
        'No email provider configured for your practice or clinic yet. Add your Resend API Key first.',
      );
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { name: true, specialization: true, email: true },
    });

    const result = await this.sendEmail({
      to,
      doctorId,
      replyTo: cfg.replyTo || doctor?.email || undefined,
      subject: `DoctorPro Test Email — Dr. ${doctor?.name || 'Practice'}`,
      html: this.buildAppointmentEmailHtml({
        heading: 'Your Practice Email API Is Active!',
        intro: cfg.usingCustomDoctorConfig
          ? `Sent using your personal doctor ${cfg.provider.toUpperCase()} API configuration.`
          : `Sent using the clinic fallback ${cfg.provider.toUpperCase()} configuration (no personal doctor key saved yet).`,
        patientName: 'Test Recipient',
        doctorName: doctor?.name ? `Dr. ${doctor.name}` : 'DoctorPro Practice',
        specialization: doctor?.specialization || 'Doctor Portal Verification',
        dateStr: this.formatDate(new Date()),
        timeSlot: '09:00 - 09:30',
        serialNumber: 1,
        status: 'CONFIRMED',
        liveQueueUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/live-queue?doctorId=${doctorId}`,
      }),
    });

    if (!result.sent) {
      throw new BadRequestException(
        result.error || 'Failed to send doctor test email.',
      );
    }

    return {
      ...result,
      usedCustomDoctorConfig: Boolean(cfg.usingCustomDoctorConfig),
    };
  }

  async sendTestEmail(to: string) {
    const cfg = await this.resolveClinicEmailConfig();
    if (cfg.provider === 'none') {
      throw new BadRequestException(
        'No email provider configured. Add your Resend API Key or Gmail App Password first.',
      );
    }

    const result = await this.sendEmail({
      to,
      subject: 'DoctorPro Email Test — Delivery Active',
      html: this.buildAppointmentEmailHtml({
        heading: 'Email Notifications Are Active!',
        intro: `This test email confirms DoctorPro (${cfg.provider.toUpperCase()}) can deliver appointment confirmations and automated reminders.`,
        patientName: 'Test Recipient',
        doctorName: 'DoctorPro Automated Mailer',
        specialization: 'System Verification',
        dateStr: this.formatDate(new Date()),
        timeSlot: '09:00 - 09:30',
        serialNumber: 1,
        status: 'CONFIRMED',
        liveQueueUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/live-queue`,
      }),
    });

    if (!result.sent) {
      throw new BadRequestException(
        result.error || 'Failed to send test email.',
      );
    }

    return result;
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    doctorId?: string;
    replyTo?: string;
  }): Promise<{
    sent: boolean;
    provider: string;
    messageId?: string;
    error?: string;
  }> {
    const cfg = await this.resolveEmailConfig(params.doctorId);
    if (cfg.provider === 'none') {
      return {
        sent: false,
        provider: 'none',
        error: 'Email provider is not configured.',
      };
    }

    const replyToAddress = params.replyTo || cfg.replyTo;

    if (cfg.provider === 'resend') {
      try {
        const bodyPayload: any = {
          from: cfg.resendFrom,
          to: [params.to],
          subject: params.subject,
          html: params.html,
        };
        if (replyToAddress) {
          bodyPayload.reply_to = replyToAddress;
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
          signal: AbortSignal.timeout(15000),
        });

        const data: any = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            sent: false,
            provider: 'resend',
            error: data?.message || `Resend returned HTTP ${res.status}`,
          };
        }
        return {
          sent: true,
          provider: 'resend',
          messageId: data?.id,
        };
      } catch (err: any) {
        return {
          sent: false,
          provider: 'resend',
          error: err?.message || 'Resend request failed',
        };
      }
    }

    // SMTP via Nodemailer (Gmail or custom SMTP)
    try {
      const transporter = nodemailer.createTransport({
        host: cfg.smtpHost,
        port: cfg.smtpPort || 465,
        secure: (cfg.smtpPort || 465) === 465,
        auth: {
          user: cfg.smtpUser,
          pass: cfg.smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: cfg.smtpFrom || cfg.smtpUser,
        to: params.to,
        ...(replyToAddress ? { replyTo: replyToAddress } : {}),
        subject: params.subject,
        html: params.html,
      });

      return {
        sent: true,
        provider: 'smtp',
        messageId: info.messageId,
      };
    } catch (err: any) {
      return {
        sent: false,
        provider: 'smtp',
        error: err?.message || 'SMTP delivery failed',
      };
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private combineDateAndSlot(date: Date, timeSlot: string): Date {
    const combined = new Date(date);
    const match = (timeSlot || '').match(/(\d{1,2}):(\d{2})/);
    if (match) {
      combined.setHours(Number(match[1]), Number(match[2]), 0, 0);
    }
    return combined;
  }

  private buildAppointmentEmailHtml(data: {
    heading: string;
    intro: string;
    patientName: string;
    doctorName: string;
    specialization: string;
    dateStr: string;
    timeSlot: string;
    serialNumber: number;
    status: string;
    liveQueueUrl: string;
  }) {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:20px; border:1px solid #e2e8f0; overflow:hidden;">
          <div style="background:#0a1e3b; color:#ffffff; padding:24px 28px;">
            <p style="margin:0; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; color:#38bdf8; font-weight:700;">DoctorPro Clinic</p>
            <h1 style="margin:6px 0 0; font-size:20px; font-weight:800;">${data.heading}</h1>
          </div>
          <div style="padding:26px 28px; font-size:14px; line-height:1.6;">
            <p style="margin-top:0;">Hi <strong>${data.patientName}</strong>,</p>
            <p style="color:#475569;">${data.intro}</p>
            <div style="background:#f1f5f9; border-radius:14px; padding:16px 18px; margin:20px 0; font-size:13px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#64748b;">Serial Token:</span>
                <strong style="color:#059669; font-size:16px;">#${data.serialNumber}</strong>
              </div>
              <div style="margin-bottom:6px;"><span style="color:#64748b;">Doctor:</span> <strong>${data.doctorName}</strong> (${data.specialization})</div>
              <div style="margin-bottom:6px;"><span style="color:#64748b;">Date:</span> <strong>${data.dateStr}</strong></div>
              <div style="margin-bottom:6px;"><span style="color:#64748b;">Time Slot:</span> <strong>${data.timeSlot}</strong></div>
              <div><span style="color:#64748b;">Status:</span> <strong>${data.status}</strong></div>
            </div>
            <div style="text-align:center; margin:24px 0 8px;">
              <a href="${data.liveQueueUrl}" style="display:inline-block; background:#0284c7; color:#ffffff; text-decoration:none; font-weight:700; font-size:13px; padding:12px 24px; border-radius:999px;">
                Track Live Queue & Turn Alerts
              </a>
            </div>
          </div>
          <div style="padding:14px 28px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center;">
            Automated notification from DoctorPro Medical Practice
          </div>
        </div>
      </div>
    `;
  }
}
