@echo off
echo Starting Proxima AI Gateway...
cd /d "D:\MY-LIFE-SYSTEM\Proxima"
set ELECTRON_DISABLE_SANDBOX=1
set ELECTRON_DISABLE_GPU=1
npx electron . --disable-gpu --disable-software-rasterizer --disable-features=NetworkServiceInProcess
