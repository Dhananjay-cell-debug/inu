# Explicit, recoverable removal of superseded designs. Never delete current source.
Add-Type -AssemblyName Microsoft.VisualBasic
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$obsoletePaths = @(
  'src/pages','src/css','src/js','src/layout.html',
  'src/home/index.html','src/home/home.css','src/home/home.js',
  'archive-before-rebuild','rebuild','design-concepts','.openai',
  'src/talk/template.html','src/talk/talk.css','src/talk/responsive.css','src/talk/content.json','src/talk/assets.json','src/talk/assets',
  'build/pages.js','build/home.js','build/home-assets.py','build/images.py','build/plates.py','build/video.sh','build/endframes.py','build/render-talk.js','build/prepare-talk-assets.py',
  'site/assets','site/about.html','site/experience.css','site/experience.js','site/reference.css','site/talk.css','dist/talk.css','inu-home.tar.gz',
  'NEXT-ASTRA-PROMPT.md','LETS-TALK.md'
)
foreach ($relativePath in $obsoletePaths) {
  $candidatePath = [IO.Path]::GetFullPath((Join-Path $projectRoot $relativePath))
  if (-not $candidatePath.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Target outside project: $candidatePath" }
  if (-not (Test-Path -LiteralPath $candidatePath)) { continue }
  $resolvedTarget = (Resolve-Path -LiteralPath $candidatePath).Path
  if (-not $resolvedTarget.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Resolved target outside project' }
  if (Test-Path -LiteralPath $resolvedTarget -PathType Container) {
    [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($resolvedTarget,[Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,[Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)
  } else {
    [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($resolvedTarget,[Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,[Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)
  }
  Write-Output "Recycled: $relativePath"
}
