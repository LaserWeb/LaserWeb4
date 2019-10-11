:: Commands alias (shorthands)
@DOSKEY install=npm install
@DOSKEY start=npm start
@DOSKEY bundle-dev=npm run bundle-dev
@DOSKEY bundle-prod=npm run bundle-prod
@DOSKEY build-docs=npm run build-docs

:: Print commands reminder
@ECHO.
@ECHO  LaserWeb Development Environment
@ECHO -------------------------------------------------------------
@ECHO  npm install          -  Install the development environment.
@ECHO  npm start            -  Start the live development server.
@ECHO  npm run bundle-dev   -  Bundle the project for development.
@ECHO  npm run bundle-prod  -  Bundle the project for production.
@ECHO  npm run build-docs   -  Build the sources documentations.
@ECHO -------------------------------------------------------------
@ECHO.
@ECHO OFF

:: Prompt
cmd /k
