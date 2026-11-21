# Start BrainCache locally after applying database migrations.
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "Applying BrainCache database migrations..."
python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    throw "Database migration failed. The API was not started. Review the error above."
}

Write-Host "Starting BrainCache API at http://127.0.0.1:8000"
python -m uvicorn app.main:app --reload
if ($LASTEXITCODE -ne 0) {
    throw "BrainCache API stopped with an error."
}
