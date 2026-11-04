@echo off
title CampusPulse Server
color 0a
echo ========================================================
echo   Starting CampusPulse Smart University OS...
echo ========================================================
echo.
cd /d "%~dp0"
"C:\Users\BILLU\tools\node\node.exe" server.js
pause

