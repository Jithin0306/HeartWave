@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
if not exist "..\..\..\resources\bin" mkdir "..\..\..\resources\bin"
cd /d "%~dp0"
cl.exe /O2 /MD /EHsc /W3 /D_WINDOWS /DUNICODE /D_UNICODE /Fe:..\..\..\resources\bin\HeartWaveCam.dll HeartWaveCam.cpp /link /DLL /DEF:HeartWaveCam.def ole32.lib oleaut32.lib advapi32.lib user32.lib gdi32.lib strmiids.lib shlwapi.lib
if %ERRORLEVEL% equ 0 (
    echo [Build] HeartWaveCam.dll compiled successfully.
) else (
    echo [Build Error] Failed to compile HeartWaveCam.dll.
)
