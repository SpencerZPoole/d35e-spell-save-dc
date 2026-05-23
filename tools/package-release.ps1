param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

$resolvedRoot = (Resolve-Path $Root).Path
$manifestPath = Join-Path $resolvedRoot 'module.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$moduleId = $manifest.id
$version = $manifest.version

if ($moduleId -ne 'd35e-spell-save-dc') {
  throw "Unexpected module id '$moduleId'."
}

$dist = Join-Path $resolvedRoot 'dist'
$stage = Join-Path $dist $moduleId
$zipPath = Join-Path $dist "$moduleId-v$version.zip"

New-Item -ItemType Directory -Path $dist -Force | Out-Null

$resolvedDist = (Resolve-Path $dist).Path
if (-not $resolvedDist.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to write outside repository root: $resolvedDist"
}

if (Test-Path -LiteralPath $stage) {
  $resolvedStage = (Resolve-Path $stage).Path
  if (-not $resolvedStage.StartsWith($resolvedDist, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove unexpected staging path: $resolvedStage"
  }
  Remove-Item -LiteralPath $resolvedStage -Recurse -Force
}

if (Test-Path -LiteralPath $zipPath) {
  $resolvedZip = (Resolve-Path $zipPath).Path
  if (-not $resolvedZip.StartsWith($resolvedDist, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove unexpected zip path: $resolvedZip"
  }
  Remove-Item -LiteralPath $resolvedZip -Force
}

New-Item -ItemType Directory -Path $stage -Force | Out-Null

$include = @(
  'module.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE.md',
  'SECURITY.md',
  'lang',
  'scripts',
  'styles'
)

foreach ($entry in $include) {
  $source = Join-Path $resolvedRoot $entry
  $target = Join-Path $stage $entry

  if (Test-Path -LiteralPath $source -PathType Container) {
    Copy-Item -LiteralPath $source -Destination $target -Recurse
  } else {
    Copy-Item -LiteralPath $source -Destination $target
  }
}

Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zipPath -Force
Write-Host "Created $zipPath"
