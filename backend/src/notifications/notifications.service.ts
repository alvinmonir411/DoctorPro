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
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
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
      const matchedAppt =
        (sub.appointmentId ? apptById.get(sub.appointmentId) : null) ||
        (sub.patientPhone ? apptByPhone.get(sub.patientPhone.trim()) : null);

      const targetSerial = matchedAppt?.serialNumber ?? sub.serialNumber;
      if (!targetSerial || targetSerial <= 0) continue;

      if (chamberStatus === 'ACTIVE' && sub.lastNotifiedSerial === currentServingSerial) {
        continue;
      }

      const ahead = targetSerial - currentServingSerial;
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
        liveQueueUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/live-queue?appointmentId=${appointment.id}&phone=${encodeURIComponent(appointment.patient?.phone || '')}`,
      });

      await this.sendEmail({
        to: appointment.patient.email,
        subject,
        html,
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
    const targetUrl = `/live-queue?appointmentId=${appointment.id}&phone=${encodeURIComponent(appointment.patient?.phone || '')}`;

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
      const targetUrl = `/live-queue?appointmentId=${appt.id}&phone=${encodeURIComponent(appt.patient?.phone || '')}`;

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
      }).catch((err) =>
        this.logger.warn(`Reminder email failed: ${err?.message}`),
      );
    }
  }

  // ─── Email Configuration (Admin-only) & Sender (Resend / SMTP) ───────

  private async resolveEmailConfig(): Promise<ResolvedEmailConfig> {
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
    };
  }

  async getAdminEmailConfig() {
    const cfg = await this.resolveEmailConfig();
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

  async sendTestEmail(to: string) {
    const cfg = await this.resolveEmailConfig();
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
  }): Promise<{
    sent: boolean;
    provider: string;
    messageId?: string;
    error?: string;
  }> {
    const cfg = await this.resolveEmailConfig();
    if (cfg.provider === 'none') {
      return {
        sent: false,
        provider: 'none',
        error: 'Email provider is not configured.',
      };
    }

    if (cfg.provider === 'resend') {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: cfg.resendFrom,
            to: [params.to],
            subject: params.subject,
            html: params.html,
          }),
          signal: AbortSignal.timeout(15000),
        });

        const data: any = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            sent: false,
            provider: 'resend',
            error:
              data?.message ||
              `Resend returned HTTP ${res.status}`,
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
