# Netlify Deployment Script

Write-Host "`n🚀 ColosssLLM Netlify Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Cyan

# Check if logged in to Netlify
Write-Host "Checking Netlify login status..." -ForegroundColor Yellow
$loginStatus = netlify status 2>&1
if ($loginStatus -match "Not logged in") {
    Write-Host "Not logged in to Netlify. Please login:" -ForegroundColor Red
    netlify login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Login failed. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Build the project
Write-Host "`nBuilding Next.js project..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Please fix errors and try again." -ForegroundColor Red
    exit 1
}

# Check if site is linked
Write-Host "`nChecking if site is linked..." -ForegroundColor Yellow
$siteInfo = netlify status 2>&1
if ($siteInfo -match "No site id found") {
    Write-Host "No site linked. Creating new site..." -ForegroundColor Yellow
    
    # Initialize new site
    Write-Host "`nInitializing Netlify site..." -ForegroundColor Green
    netlify init
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Site initialization failed." -ForegroundColor Red
        exit 1
    }
}

# Deploy to Netlify
Write-Host "`nDeploying to Netlify..." -ForegroundColor Green
netlify deploy --prod --dir=.next

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "`nOpening your site..." -ForegroundColor Cyan
    netlify open:site
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Set environment variables in Netlify dashboard" -ForegroundColor White
    Write-Host "2. Update netlify.toml with your Railway backend URL" -ForegroundColor White
    Write-Host "3. Configure custom domain if needed" -ForegroundColor White
} else {
    Write-Host "`n❌ Deployment failed. Check the errors above." -ForegroundColor Red
    exit 1
}
