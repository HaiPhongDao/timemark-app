@echo off
title TimeMark Photo Stamper
cd /d "%~dp0"
echo ========================================================
echo         KHOI DONG TIMEMARK PHOTO STAMPER WEB APP
echo ========================================================
echo Dang khoi dong may chu noi bo va mo trinh duyet...
python server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Python khong co san, dang mo truc tiep index.html tren trinh duyet...
    start index.html
)
pause
