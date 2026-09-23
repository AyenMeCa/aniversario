param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$sheet = New-Object System.Drawing.Bitmap 384, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$magenta = [System.Drawing.ColorTranslator]::FromHtml('#FF00FF')
$outline = [System.Drawing.ColorTranslator]::FromHtml('#241A1B')
$darkLeather = [System.Drawing.ColorTranslator]::FromHtml('#513323')
$leather = [System.Drawing.ColorTranslator]::FromHtml('#82552C')
$lightLeather = [System.Drawing.ColorTranslator]::FromHtml('#AC7440')
$white = [System.Drawing.ColorTranslator]::FromHtml('#F3F0E8')
$lightGray = [System.Drawing.ColorTranslator]::FromHtml('#C9CBC7')
$midGray = [System.Drawing.ColorTranslator]::FromHtml('#979B99')

function Convert-Pixel([System.Drawing.Color]$pixel) {
    if ($pixel.R -gt 160 -and $pixel.B -gt 150 -and $pixel.G -lt 105 -and ($pixel.R + $pixel.B) -gt 360) {
        return $magenta
    }

    $luma = (0.299 * $pixel.R) + (0.587 * $pixel.G) + (0.114 * $pixel.B)
    $isBrown = $pixel.R -gt ($pixel.B + 18) -and $pixel.R -gt ($pixel.G + 8) -and $pixel.B -lt 145

    if ($luma -lt 64) { return $outline }
    if ($isBrown) {
        if ($luma -lt 92) { return $darkLeather }
        if ($luma -lt 145) { return $leather }
        return $lightLeather
    }
    if ($luma -lt 150) { return $midGray }
    if ($luma -lt 218) { return $lightGray }
    return $white
}

try {
    $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
    try { $sheetGraphics.Clear($magenta) } finally { $sheetGraphics.Dispose() }

    $sourceCellWidth = [int]($sourceBitmap.Width / 4)
    $cropX = 8
    $cropY = 140
    $cropWidth = 497
    $cropHeight = 423
    $horseWidth = 56
    $horseHeight = 44
    $offsetX = 20
    $offsetY = 10

    $frames = @()
    for ($frameIndex = 0; $frameIndex -lt 4; $frameIndex++) {
        $frame = New-Object System.Drawing.Bitmap 96, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $frameGraphics = [System.Drawing.Graphics]::FromImage($frame)
        try { $frameGraphics.Clear($magenta) } finally { $frameGraphics.Dispose() }

        for ($y = 0; $y -lt $horseHeight; $y++) {
            $sourceY = [Math]::Min($sourceBitmap.Height - 1, $cropY + [int][Math]::Floor((($y + 0.5) * $cropHeight) / $horseHeight))
            for ($x = 0; $x -lt $horseWidth; $x++) {
                $sourceLocalX = $cropX + [int][Math]::Floor((($x + 0.5) * $cropWidth) / $horseWidth)
                $sourceX = [Math]::Min($sourceBitmap.Width - 1, ($frameIndex * $sourceCellWidth) + $sourceLocalX)
                $frame.SetPixel($offsetX + $x, $offsetY + $y, (Convert-Pixel $sourceBitmap.GetPixel($sourceX, $sourceY)))
            }
        }
        $frames += $frame
    }

    # Lock the body underside, all four legs, and all hooves to frame 1.
    # The tail remains outside the left edge of this region, while the head
    # and ears remain outside the right edge, preserving their idle motion.
    for ($frameIndex = 1; $frameIndex -lt 4; $frameIndex++) {
        for ($y = 35; $y -le 53; $y++) {
            for ($x = 28; $x -le 63; $x++) {
                $frames[$frameIndex].SetPixel($x, $y, $frames[0].GetPixel($x, $y))
            }
        }
    }

    $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
    try {
        $sheetGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        for ($frameIndex = 0; $frameIndex -lt 4; $frameIndex++) {
            $sheetGraphics.DrawImageUnscaled($frames[$frameIndex], $frameIndex * 96, 0)
        }
    } finally { $sheetGraphics.Dispose() }

    $outputDirectory = Split-Path -Parent $Output
    if ($outputDirectory) { [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null }
    $sheet.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap = New-Object System.Drawing.Bitmap 1152, 192, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.DrawImage($sheet, 0, 0, 1152, 192)
            } finally { $previewGraphics.Dispose() }
            $previewBitmap.Save($Preview, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $previewBitmap.Dispose() }
    }
} finally {
    foreach ($frame in $frames) { $frame.Dispose() }
    $sheet.Dispose()
    $sourceBitmap.Dispose()
}
