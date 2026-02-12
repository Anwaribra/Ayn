$files = @(
    "d:\CV-4\graduation\Ayn\frontend\ayn-landing-page\app\platform\(dashboard)\dashboard\page.tsx",
    "d:\CV-4\graduation\Ayn\frontend\ayn-landing-page\app\platform\(dashboard)\evidence\page.tsx",
    "d:\CV-4\graduation\Ayn\frontend\ayn-landing-page\app\platform\(dashboard)\standards\page.tsx",
    "d:\CV-4\graduation\Ayn\frontend\ayn-landing-page\app\platform\(dashboard)\gap-analysis\page.tsx",
    "d:\CV-4\graduation\Ayn\frontend\ayn-landing-page\app\platform\(dashboard)\analytics\page.tsx",
    "d:\CV-4\graduation\Ayn\frontend\ayn-landing-page\app\platform\(dashboard)\settings\page.tsx",
    "d:\CV-4\graduation\Ayn\frontend\ayn-landing-page\app\platform\(dashboard)\archive\page.tsx",
    "d:\CV-4\graduation\Ayn\frontend\ayn-landing-page\components\platform\sidebar-enhanced.tsx",
    "d:\CV-4\graduation\Ayn\frontend\ayn-landing-page\app\platform\(dashboard)\workflows\page.tsx",
    "d:\CV-4\graduation\Ayn\frontend\ayn-landing-page\components\platform\platform-shell.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        $content = $content.Replace('text-[8px]', 'text-[10px]')
        $content = $content.Replace('text-[9px]', 'text-[10px]')
        $content = $content.Replace('text-[11px]', 'text-xs')
        $content = $content.Replace('text-[12px]', 'text-xs')
        $content = $content.Replace('text-[13px]', 'text-sm')
        $content = $content.Replace('text-[14px]', 'text-sm')
        $content = $content.Replace('text-[15px]', 'text-sm')
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Updated $file"
    } else {
        Write-Host "File not found: $file"
    }
}
