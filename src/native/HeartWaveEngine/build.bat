@echo off
setlocal
if not exist "..\..\..\resources\bin" mkdir "..\..\..\resources\bin"
cd /d "%~dp0"

echo [Build] Building 64-bit HeartWaveEngine.dll (DirectX 11 Native Engine)...
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

if exist "..\..\..\resources\bin\HeartWaveEngine.dll" (
    move /y "..\..\..\resources\bin\HeartWaveEngine.dll" "..\..\..\resources\bin\HeartWaveEngine.dll.old.%RANDOM%" >nul 2>&1
)

cl.exe /O2 /MD /EHsc /W3 /std:c++17 /D_WINDOWS /DUNICODE /D_UNICODE /DHEARTWAVEENGINE_EXPORTS /Fe:..\..\..\resources\bin\HeartWaveEngine.dll HeartWaveEngine.cpp D3D11Context.cpp /link /DLL /DEF:HeartWaveEngine.def d3d11.lib dxgi.lib d3dcompiler.lib user32.lib ole32.lib
if %ERRORLEVEL% equ 0 (
    echo [Build] 64-bit HeartWaveEngine.dll compiled successfully.
) else (
    echo [Build Error] Failed to compile 64-bit HeartWaveEngine.dll.
)
