@echo off
title LPS Bridge
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed.
  echo Install the LTS version from https://nodejs.org, then double-click this file again.
  echo.
  pause
  exit /b 1
)
node lps-bridge.js
echo.
echo The bridge has stopped.
pause
