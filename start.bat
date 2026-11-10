@echo off
echo Starting DoctorPro Medical Website System...
echo ==============================================
echo [1/2] Starting NestJS Backend (Port 4000)...
start "DoctorPro Backend" cmd /k "cd backend && npm run start:prod"

echo [2/2] Starting Next.js Frontend (Port 3000)...
start "DoctorPro Frontend" cmd /k "cd frontend && npm start"

echo ==============================================
echo DoctorPro is running!
echo Public Site:    http://localhost:3000
echo Admin Portal:   http://localhost:3000/admin/login
echo Backend API:    http://localhost:4000/api
echo Swagger Docs:   http://localhost:4000/api/docs
echo Admin Login:    admin@doctorpro.com / admin123
echo ==============================================
pause
