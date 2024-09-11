@echo OFF
SetLocal EnableDelayedExpansion

REM  https://obfuscator.io

SET CURL="%ProgramW6432%\Utils\curl.exe"

SET SUBDIR=rooms
SET SUBDIR=www

SET SRC_ROOT=C:\dev\GitHub\static-cytube.github.io\!SUBDIR!
SET DST_ROOT=C:\dev\GitHub\static-cytube.github.io\!SUBDIR!

PushD "!SRC_ROOT!"
rem ATTRIB +A

:: ####################################################################################################################################################
FOR /F "usebackq delims==" %%I IN (`dir *.js *.css /b /Aa`) DO (
  @echo.####################################################################################################################################################
  @echo %%I

  @echo %%~nI | FindStr /I /C:".min" >NUL 2>NUL
  IF !ERRORLEVEL! GTR 0 (
    SET SRC_FILE=%%~nI%%~xI
    SET MIN_FILE=!DST_ROOT!\%%~nI.min%%~xI
    DEL /F /Q "!MIN_FILE!" 2>NUL >NUL

    SET APIURL="https://www.toptal.com/developers/javascript-minifier/api/raw"

    @echo %%~xI | FindStr /I /C:".css" >NUL 2>NUL
    IF !ERRORLEVEL! EQU 0  SET APIURL="https://www.toptal.com/developers/cssminifier/api/raw"

    REM  https://www.toptal.com/developers/javascript-minifier/documentation
    SET CMDLINE=%CURL% --output "!MIN_FILE!" --data-urlencode "input@!SRC_FILE!" !APIURL!
    @echo !CMDLINE!
    !CMDLINE!
    @echo.
  )
)

MOVE "C:\dev\GitHub\static-cytube.github.io\rooms\rooms_bot.min.js" "rooms.min.js"

ATTRIB -A
PopD

:: ####################################################################################################################################################
:END
@echo.
@echo ####################################################################################################################################################
PopD
PAUSE
EXIT

:: ####################################################################################################################################################
:: ####################################################################################################################################################
