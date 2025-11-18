# Fix all catch (error: any) to catch (error)
$files = Get-ChildItem -Path "e:\TTGDBH\BH-EDU\web\app" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix catch (error: any)
    $content = $content -replace '\} catch \(err: any\)', '} catch (err)'
    $content = $content -replace '\} catch \(error: any\)', '} catch (error)'
    $content = $content -replace '\} catch \(e: any\)', '} catch (e)'
    
    # Fix const functions with : any
    $content = $content -replace '= async \(([^:]+): any\)', '= async ($1)'
    
    # Save if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done fixing any types!"
