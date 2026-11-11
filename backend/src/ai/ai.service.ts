import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async chatWithAssistant(message: string, history: ChatHistoryItem[] = []) {
    if (!message || !message.trim()) {
      throw new BadRequestException('Message cannot be empty.');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('Gemini API key is not configured on the server.');
    }

    // 1. Fetch live active doctors and departments from PostgreSQL
    const [doctors, departments] = await Promise.all([
      this.prisma.doctor.findMany({
        where: { isActive: true },
        include: { department: true, schedules: { where: { isActive: true } } },
      }),
      this.prisma.department.findMany({
        where: { isActive: true },
      }),
    ]);

    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const doctorDirectory = doctors.map((d) => ({
      id: d.id,
      name: d.name,
      title: d.title,
      specialization: d.specialization,
      department: d.department?.name || 'General',
      feeBDT: d.consultationFee,
      experienceYears: d.experienceYears,
      chamberAddress: d.chamberAddress,
      appointmentHours: `${d.appointmentStartTime || '09:00'} to ${d.appointmentEndTime || '17:00'}`,
      slotDurationMinutes: d.slotDuration,
      visitingDays: d.schedules.map((s) => `${daysMap[s.dayOfWeek] || s.dayOfWeek} (${s.startTime}-${s.endTime})`),
      bio: d.bio || '',
    }));

    const deptDirectory = departments.map((dept) => ({
      name: dept.name,
      description: dept.description || '',
    }));

    const systemInstruction = `You are "DoctorPro AI Health Assistant", a helpful, empathetic medical concierge chatbot for DoctorPro Clinic.

CLINIC DEPARTMENTS:
${JSON.stringify(deptDirectory, null, 2)}

ACTIVE CLINIC DOCTORS DIRECTORY:
${JSON.stringify(doctorDirectory, null, 2)}

YOUR INSTRUCTIONS:
1. Language Match: Detect the user's language. If the user writes in Bengali (বাংলা) or Banglish (e.g., "amar matha betha", "chokh e problem"), reply warmly in clear Bengali (বাংলা). If they write in English, reply in English.
2. Medical Guidance & Safety: Listen to the patient's symptoms or questions and give practical, concise medical guidance and safe self-care tips (1-2 short paragraphs). Always state clearly that this is informational guidance and consulting a qualified doctor is required for proper diagnosis. If symptoms sound critical (chest pain with sweating/breathlessness, severe trauma, sudden weakness/stroke signs), flag urgencyLevel as "URGENT" and advise going to the Emergency Room immediately.
3. Doctor Recommendation: Recommend the most relevant active doctor(s) from the ACTIVE CLINIC DOCTORS DIRECTORY above! Explain WHY that doctor is suitable and mention their specialization, fee (৳), and chamber visiting hours.
   - CRITICAL: In "recommendedDoctorIds", ONLY include exact "id" strings from the ACTIVE CLINIC DOCTORS DIRECTORY above (up to 3 best matches). If no exact specialist is present, recommend a General Physician or the closest available doctor.
   - If the user just says "hi" or asks general clinic info, welcome them warmly and mention how you can help them find the right specialist.

RESPONSE FORMAT (MUST BE STRICT VALID JSON):
{
  "reply": "Your helpful, friendly response in Bengali or English (can use simple bullet points)",
  "recommendedDoctorIds": ["exact-doctor-uuid-from-directory"],
  "recommendedDepartment": "Name of best matching department",
  "urgencyLevel": "NORMAL" | "MODERATE" | "URGENT"
}`;

    // Build conversation contents
    const contents = [
      ...history.slice(-8).map((h) => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      })),
      {
        role: 'user',
        parts: [{ text: message.trim() }],
      },
    ];

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    };

    const modelsToTry = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(20000),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = new Error(`Gemini API (${model}) responded with ${response.status}: ${errText}`);
          continue;
        }

        const data: any = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          lastError = new Error('Empty response from AI model');
          continue;
        }

        let parsed: any = {};
        try {
          parsed = JSON.parse(rawText);
        } catch {
          // Fallback if AI returned slightly wrapped JSON
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            parsed = { reply: rawText, recommendedDoctorIds: [] };
          }
        }

        const recIds: string[] = Array.isArray(parsed.recommendedDoctorIds)
          ? parsed.recommendedDoctorIds
          : [];

        const recommendedDoctors = doctors
          .filter((d) => recIds.includes(d.id))
          .map((d) => ({
            id: d.id,
            name: d.name,
            title: d.title,
            slug: d.slug,
            specialization: d.specialization,
            department: d.department?.name || 'General',
            consultationFee: d.consultationFee,
            image: d.image,
            appointmentStartTime: d.appointmentStartTime || '09:00',
            appointmentEndTime: d.appointmentEndTime || '17:00',
            slotDuration: d.slotDuration || 30,
          }));

        return {
          reply: parsed.reply || 'I am here to help you find the right doctor.',
          recommendedDoctors,
          recommendedDepartment: parsed.recommendedDepartment || null,
          urgencyLevel: parsed.urgencyLevel || 'NORMAL',
          modelUsed: model,
        };
      } catch (err: any) {
        lastError = err;
      }
    }

    throw new BadRequestException(
      `AI consultation service is temporarily unavailable: ${lastError?.message || 'Unknown AI error'}`,
    );
  }
}
