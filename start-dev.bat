@echo off
echo Starting DoctorPro in Development Mode...
echo ==============================================
echo [1/2] Starting NestJS Backend (Dev Mode)...
start "DoctorPro Backend Dev" cmd /k "cd backend && npm run dev"

echo [2/2] Starting Next.js Frontend (Dev Mode)...
start "DoctorPro Frontend Dev" cmd /k "cd frontend && npm run dev"

echo ==============================================
echo Public Site:    http://localhost:3000
echo Admin Portal:   http://localhost:3000/admin/login
echo Backend API:    http://localhost:4000/api
echo Swagger Docs:   http://localhost:4000/api/docs
echo Admin Login:    admin@doctorpro.com / admin123
echo ==============================================
pause
