@echo off
setlocal
if not exist "..\..\..\resources\bin" mkdir "..\..\..\resources\bin"
cd /d "%~dp0"

echo [Build] Building 64-bit HeartWaveCam.dll...
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

if exist "..\..\..\resources\bin\HeartWaveCam.dll" (
    move /y "..\..\..\resources\bin\HeartWaveCam.dll" "..\..\..\resources\bin\HeartWaveCam.dll.old.%RANDOM%" >nul 2>&1
)

cl.exe /O2 /MD /EHsc /W3 /D_WINDOWS /DUNICODE /D_UNICODE /Fe:..\..\..\resources\bin\HeartWaveCam.dll HeartWaveCam.cpp /link /DLL /DEF:HeartWaveCam.def ole32.lib oleaut32.lib advapi32.lib user32.lib gdi32.lib strmiids.lib shlwapi.lib winmm.lib
if %ERRORLEVEL% equ 0 (
    echo [Build] 64-bit HeartWaveCam.dll compiled successfully.
) else (
    echo [Build Error] Failed to compile 64-bit HeartWaveCam.dll.
)
