import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing DoctorPro database (Clean setup)...');

  // Clean existing data
  await prisma.appointment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.service.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.gallery.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // Create Super Admin User ONLY
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@doctorpro.com',
      phone: '+880 1700-000000',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin account created: ${admin.email} (Password: admin123)`);

  // Default System Settings in English
  const defaultSettings = [
    { key: 'clinic_name', value: 'DoctorPro Medical Practice', group: 'general' },
    { key: 'clinic_tagline', value: 'Quality Healthcare You Can Trust', group: 'general' },
    { key: 'clinic_email', value: 'contact@doctorpro.com', group: 'contact' },
    { key: 'clinic_phone', value: '+880 1700-000000', group: 'contact' },
    { key: 'clinic_emergency', value: '+880 1900-000000', group: 'contact' },
    { key: 'clinic_address', value: 'House 42, Road 11, Dhanmondi, Dhaka, Bangladesh', group: 'contact' },
    { key: 'working_hours', value: 'Sat - Thu: 9:00 AM - 9:00 PM, Friday: Closed', group: 'general' },
    { key: 'facebook_url', value: 'https://facebook.com', group: 'social' },
    { key: 'twitter_url', value: 'https://twitter.com', group: 'social' },
    { key: 'linkedin_url', value: 'https://linkedin.com', group: 'social' },
  ];

  for (const s of defaultSettings) {
    await prisma.settings.create({
      data: s,
    });
  }

  // Pre-seed standard medical departments (Clean categories, no fake doctor data)
  const standardDepartments = [
    { name: 'General Medicine', slug: 'general-medicine', description: 'General outpatient care and chronic health management', icon: 'Stethoscope' },
    { name: 'Cardiology', slug: 'cardiology', description: 'Cardiovascular diagnostics and heart care', icon: 'Heart' },
    { name: 'Pediatrics', slug: 'pediatrics', description: 'Infant, child, and adolescent healthcare', icon: 'Baby' },
    { name: 'Gynecology & Obstetrics', slug: 'gynecology', description: 'Women health, prenatal, and maternity care', icon: 'Heart' },
    { name: 'Neurology', slug: 'neurology', description: 'Brain and nervous system diagnostics', icon: 'Activity' },
    { name: 'Orthopedics', slug: 'orthopedics', description: 'Bone, joint, and musculoskeletal care', icon: 'Activity' },
    { name: 'Dermatology', slug: 'dermatology', description: 'Skin, hair, and dermatological care', icon: 'Sparkles' },
    { name: 'Ophthalmology', slug: 'ophthalmology', description: 'Eye exams and vision care', icon: 'Eye' },
  ];

  for (const dept of standardDepartments) {
    await prisma.department.create({
      data: dept,
    });
  }

  console.log('✅ Standard medical departments initialized');
  console.log('✅ Default settings initialized');
  console.log('🚀 DoctorPro initialized cleanly without dummy demo data.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
