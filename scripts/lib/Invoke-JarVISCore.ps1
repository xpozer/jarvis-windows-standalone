function Invoke-JarvisCoreScript {
  param(
    [Parameter(Mandatory=$true)][string]$CorePath,
    [Parameter(Mandatory=$true)][string]$Root,
    [hashtable]$BoundParameters = @{},
    [hashtable]$LiteralReplacements = @{}
  )

  $resolvedRoot = (Resolve-Path $Root).Path.TrimEnd('\\')
  $script:JarvisRootOverride = $resolvedRoot

  $code = Get-Content -Raw -Path $CorePath
  $code = $code -replace '\$Root = Split-Path -Parent \$MyInvocation\.MyCommand\.Path', '$Root = $script:JarvisRootOverride'
  $code = $code -replace '\$SourceRoot = Split-Path -Parent \$MyInvocation\.MyCommand\.Path', '$SourceRoot = $script:JarvisRootOverride'

  foreach($key in $LiteralReplacements.Keys){
    $code = $code.Replace([string]$key, [string]$LiteralReplacements[$key])
  }

  & ([scriptblock]::Create($code)) @BoundParameters
}
