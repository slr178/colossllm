# GitHub Setup Script
# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
# Replace REPO_NAME with your repository name (e.g., bnbarena)

$githubUsername = Read-Host "Enter your GitHub username"
$repoName = Read-Host "Enter your repository name (e.g., bnbarena)"

Write-Host "Setting up GitHub remote..." -ForegroundColor Green
git remote add origin "https://github.com/$githubUsername/$repoName.git"

Write-Host "Pushing to GitHub..." -ForegroundColor Green
git branch -M main
git push -u origin main

Write-Host "GitHub setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Netlify.com and import your GitHub repository"
Write-Host "2. Go to Railway.app and deploy from your GitHub repository"
Write-Host "3. Configure environment variables on both platforms"
Write-Host ""
Write-Host "Your repository URL: https://github.com/$githubUsername/$repoName" -ForegroundColor Cyan
