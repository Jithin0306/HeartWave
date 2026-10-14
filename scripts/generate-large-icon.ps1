Add-Type -AssemblyName System.Drawing

$srcPath = "F:\HeartWave\src\renderer\src\assets\logo-icon.png"
$outPath = "F:\HeartWave\large-app-icon.png"

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height

$minX = $w
$maxX = 0
$minY = $h
$maxY = 0

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        if ($pixel.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Content bounds: minX=$minX, maxX=$maxX, minY=$minY, maxY=$maxY"
$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1
Write-Host "Content dimensions: ${cropW}x${cropH}"

# Create 1024x1024 target bitmap
$targetBmp = [System.Drawing.Bitmap]::new(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($targetBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Scale content to fit 950x950 (leaves 37px = ~3.6% margin for clean taskbar padding)
$targetSize = 950
$scale = [Math]::Min($targetSize / $cropW, $targetSize / $cropH)
$drawW = [int]($cropW * $scale)
$drawH = [int]($cropH * $scale)
$destX = [int]((1024 - $drawW) / 2)
$destY = [int]((1024 - $drawH) / 2)

$srcRect = [System.Drawing.Rectangle]::new($minX, $minY, $cropW, $cropH)
$destRect = [System.Drawing.Rectangle]::new($destX, $destY, $drawW, $drawH)

$g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$bmp.Dispose()

$targetBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$targetBmp.Dispose()

Write-Host "Generated large-app-icon.png with drawn size: ${drawW}x${drawH} at (${destX},${destY})"
