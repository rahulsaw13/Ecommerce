@echo off
echo Clearing React cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .cache rmdir /s /q .cache
echo Cache cleared!
echo.
echo Please restart your dev server now with: npm start
pause
