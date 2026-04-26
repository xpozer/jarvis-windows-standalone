@echo off
cd /d "%~dp0"
if not exist "piper" mkdir "piper"
if not exist "piper\voices" mkdir "piper\voices"
echo Piper Ordner vorbereitet.
echo Lege piper.exe in den Ordner piper und Stimmen in piper\voices.
echo JARVIS Voice Core funktioniert auch ohne Piper ueber Browser/Windows TTS.
pause
