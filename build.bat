@echo off
REM Build script for deutschmark's Alert Creator
REM Creates a standalone EXE using PyInstaller

echo ========================================
echo deutschmark's Alert Creator - Build EXE
echo ========================================
echo.

REM Check if PyInstaller is installed
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo Installing PyInstaller...
    pip install pyinstaller
)

echo.
echo Building EXE...
echo.

REM Build with PyInstaller
pyinstaller ^
    --name "AlertCreator" ^
    --onefile ^
    --windowed ^
    --icon=NONE ^
    --add-data "static;static" ^
    --hidden-import=flask ^
    --noconfirm ^
    app.py

echo.
echo ========================================
echo Build complete!
echo.
echo EXE location: dist\AlertCreator.exe
echo.
echo NOTE: Users still need FFmpeg and yt-dlp installed:
echo   - FFmpeg: winget install Gyan.FFmpeg
echo   - yt-dlp: pip install yt-dlp
echo ========================================

pause
