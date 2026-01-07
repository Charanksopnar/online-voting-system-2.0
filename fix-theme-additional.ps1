$filePath = "d:\evote 2.0\pages\user\EditProfile.tsx"
$content = Get-Content $filePath -Raw

# Security Check Modal - already has some dark mode, but let's ensure it's complete
# (The modal already has dark mode from the previous implementation)

# Face Update Section
$content = $content -replace 'bg-blue-50/50 rounded-xl border border-blue-100', 'bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800'
$content = $content -replace 'bg-gray-200 rounded-full mb-3', 'bg-gray-200 dark:bg-gray-700 rounded-full mb-3'
$content = $content -replace 'text-gray-400\"\u003e', 'text-gray-400 dark:text-gray-500\">'
$content = $content -replace 'text-primary-600 hover:text-primary-700 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200', 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-600'
$content = $content -replace 'text-xs text-blue-600 mt-2', 'text-xs text-blue-600 dark:text-blue-400 mt-2'
$content = $content -replace 'text-xs text-red-500 mt-2', 'text-xs text-red-500 dark:text-red-400 mt-2'
$content = $content -replace 'text-xs text-green-600 mt-2', 'text-xs text-green-600 dark:text-green-400 mt-2'

# Write with proper line endings
$content | Set-Content $filePath -Encoding UTF8
Write-Host "Additional theme fixes applied successfully!"
