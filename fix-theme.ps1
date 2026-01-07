$filePath = "d:\evote 2.0\pages\user\EditProfile.tsx"
$content = Get-Content $filePath -Raw

# Main container
$content = $content -replace 'className="min-h-screen bg-gray-50 pt-8 pb-12', 'className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pt-8 pb-12'
$content = $content -replace 'px-4 sm:px-6 lg:px-8">', 'px-4 sm:px-6 lg:px-8 transition-colors duration-200">'

# Back button and card
$content = $content -replace 'text-gray-500 hover:text-gray-700 mb-6"', 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors"'
$content = $content -replace 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden', 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden'

# Labels and inputs
$content = $content -replace 'text-sm font-medium text-gray-700"', 'text-sm font-medium text-gray-700 dark:text-gray-300"'
$content = $content -replace 'w-full p-2 border rounded-md', 'w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md'
$content = $content -replace 'focus:ring-primary-500 focus:border-primary-500" /', 'focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" /'
$content = $content -replace 'focus:ring-primary-500 focus:border-primary-500" placeholder', 'focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" placeholder'

# Disabled email field
$content = $content -replace 'bg-gray-50 text-gray-500 cursor-not-allowed', 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'

# EPIC section
$content = $content -replace 'bg-yellow-50/50 rounded-xl border border-yellow-100 space-y-4', 'bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800 space-y-4'
$content = $content -replace 'text-yellow-800 font-semibold', 'text-yellow-800 dark:text-yellow-200 font-semibold'
$content = $content -replace 'text-sm text-yellow-700"', 'text-sm text-yellow-700 dark:text-yellow-300"'
$content = $content -replace 'text-gray-400 mb-1', 'text-gray-400 dark:text-gray-500 mb-1'
$content = $content -replace 'text-xs text-gray-500 font-medium', 'text-xs text-gray-500 dark:text-gray-400 font-medium'
$content = $content -replace 'border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50', 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
$content = $content -replace 'focus:ring-primary-500 focus:border-primary-500 uppercase', 'focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white uppercase'

# Write with proper line endings
$content | Set-Content $filePath -Encoding UTF8
Write-Host "Theme fixes applied successfully!"
