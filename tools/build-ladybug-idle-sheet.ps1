param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$sheet = New-Object System.Drawing.Bitmap 256, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$magenta = [System.Drawing.ColorTranslator]::FromHtml('#FF00FF')
$outline = [System.Drawing.ColorTranslator]::FromHtml('#241A27')
$hair = [System.Drawing.ColorTranslator]::FromHtml('#172039')
$hairLight = [System.Drawing.ColorTranslator]::FromHtml('#34446F')
$redDark = [System.Drawing.ColorTranslator]::FromHtml('#9E202B')
$red = [System.Drawing.ColorTranslator]::FromHtml('#D93438')
$skinShadow = [System.Drawing.ColorTranslator]::FromHtml('#D88F83')
$skin = [System.Drawing.ColorTranslator]::FromHtml('#F2C1AE')
$blue = [System.Drawing.ColorTranslator]::FromHtml('#45BDE0')
$white = [System.Drawing.ColorTranslator]::FromHtml('#EDF3EE')

function Convert-Pixel([System.Drawing.Color]$pixel) {
    if ($pixel.R -gt 160 -and $pixel.B -gt 150 -and $pixel.G -lt 105 -and ($pixel.R + $pixel.B) -gt 360) {
        return $magenta
    }

    $luma = (0.299 * $pixel.R) + (0.587 * $pixel.G) + (0.114 * $pixel.B)
    if ($luma -lt 55) { return $outline }

    if ($pixel.B -gt ($pixel.R + 18)) {
        if ($pixel.G -gt 105 -and $luma -gt 105) { return $blue }
        if ($luma -lt 72) { return $hair }
        return $hairLight
    }

    if ($pixel.R -gt ($pixel.G + 38) -and $pixel.R -gt ($pixel.B + 28)) {
        if ($luma -lt 105) { return $redDark }
        return $red
    }

    if ($pixel.R -gt 155 -and $pixel.G -gt 95 -and $pixel.B -gt 80) {
        if ($luma -lt 180) { return $skinShadow }
        return $skin
    }

    if ($luma -gt 195) { return $white }
    if ($luma -lt 95) { return $hair }
    return $hairLight
}

$frames = @()
try {
    $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
    try { $sheetGraphics.Clear($magenta) } finally { $sheetGraphics.Dispose() }

    $sourceCellWidth = [int]($sourceBitmap.Width / 4)
    $cropX = 30
    $cropY = 142
    $cropWidth = 443
    $cropHeight = 541
    $characterWidth = 26
    $characterHeight = 30
    $offsetX = 19
    $offsetY = 18

    for ($frameIndex = 0; $frameIndex -lt 4; $frameIndex++) {
        $frame = New-Object System.Drawing.Bitmap 64, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $frameGraphics = [System.Drawing.Graphics]::FromImage($frame)
        try { $frameGraphics.Clear($magenta) } finally { $frameGraphics.Dispose() }

        for ($y = 0; $y -lt $characterHeight; $y++) {
            $sourceY = [Math]::Min($sourceBitmap.Height - 1, $cropY + [int][Math]::Floor((($y + 0.5) * $cropHeight) / $characterHeight))
            for ($x = 0; $x -lt $characterWidth; $x++) {
                $sourceLocalX = $cropX + [int][Math]::Floor((($x + 0.5) * $cropWidth) / $characterWidth)
                $sourceX = [Math]::Min($sourceBitmap.Width - 1, ($frameIndex * $sourceCellWidth) + $sourceLocalX)
                $frame.SetPixel($offsetX + $x, $offsetY + $y, (Convert-Pixel $sourceBitmap.GetPixel($sourceX, $sourceY)))
            }
        }
        $frames += $frame
    }

    # Legs and feet are copied pixel-for-pixel from the rest pose. Upper-body
    # differences from the generated frames retain the breathing and pigtail motion.
    for ($frameIndex = 1; $frameIndex -lt 4; $frameIndex++) {
        for ($y = 41; $y -le 47; $y++) {
            for ($x = 19; $x -le 44; $x++) {
                $frames[$frameIndex].SetPixel($x, $y, $frames[0].GetPixel($x, $y))
            }
        }
    }

    $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
    try {
        $sheetGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        for ($frameIndex = 0; $frameIndex -lt 4; $frameIndex++) {
            $sheetGraphics.DrawImageUnscaled($frames[$frameIndex], $frameIndex * 64, 0)
        }
    } finally { $sheetGraphics.Dispose() }

    $outputDirectory = Split-Path -Parent $Output
    if ($outputDirectory) { [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null }
    $sheet.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap = New-Object System.Drawing.Bitmap 768, 192, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.DrawImage($sheet, 0, 0, 768, 192)
            } finally { $previewGraphics.Dispose() }
            $previewBitmap.Save($Preview, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $previewBitmap.Dispose() }
    }
} finally {
    foreach ($frame in $frames) { $frame.Dispose() }
    $sheet.Dispose()
    $sourceBitmap.Dispose()
}
