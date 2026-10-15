@echo off
setlocal
if not exist "..\..\..\resources\bin" mkdir "..\..\..\resources\bin"
cd /d "%~dp0"

echo [Build] Building 32-bit HeartWaveCam32.dll...
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars32.bat"

if exist "..\..\..\resources\bin\HeartWaveCam32.dll" (
    move /y "..\..\..\resources\bin\HeartWaveCam32.dll" "..\..\..\resources\bin\HeartWaveCam32.dll.old.%RANDOM%" >nul 2>&1
)

cl.exe /O2 /MD /EHsc /W3 /D_WINDOWS /DUNICODE /D_UNICODE /Fe:..\..\..\resources\bin\HeartWaveCam32.dll HeartWaveCam.cpp /link /DLL /DEF:HeartWaveCam.def ole32.lib oleaut32.lib advapi32.lib user32.lib gdi32.lib strmiids.lib shlwapi.lib winmm.lib
if %ERRORLEVEL% equ 0 (
    echo [Build] 32-bit HeartWaveCam32.dll compiled successfully.
) else (
    echo [Build Error] Failed to compile 32-bit HeartWaveCam32.dll.
)
