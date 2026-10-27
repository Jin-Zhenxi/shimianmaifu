param([ValidateSet('encrypt','decrypt')][string]$Action)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$credentialInput = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String([Console]::In.ReadToEnd()))
if ($Action -eq 'encrypt') {
  $credentialBytes = [Text.Encoding]::UTF8.GetBytes($credentialInput)
  $credentialOutput = [Security.Cryptography.ProtectedData]::Protect($credentialBytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  [Console]::Out.Write([Convert]::ToBase64String($credentialOutput))
} else {
  $credentialBytes = [Convert]::FromBase64String($credentialInput)
  $credentialOutput = [Security.Cryptography.ProtectedData]::Unprotect($credentialBytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  [Console]::Out.Write([Text.Encoding]::UTF8.GetString($credentialOutput))
}
