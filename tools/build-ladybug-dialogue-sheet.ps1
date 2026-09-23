param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$sheet = New-Object System.Drawing.Bitmap 192, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

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
    if ($luma -lt 52) { return $outline }

    if ($pixel.B -gt ($pixel.R + 18)) {
        if ($pixel.G -gt 110 -and $luma -gt 110) { return $blue }
        if ($luma -lt 75) { return $hair }
        return $hairLight
    }

    if ($pixel.R -gt ($pixel.G + 42) -and $pixel.R -gt ($pixel.B + 28)) {
        if ($luma -lt 108) { return $redDark }
        return $red
    }

    if ($pixel.R -gt 155 -and $pixel.G -gt 92 -and $pixel.B -gt 78) {
        if ($luma -lt 182) { return $skinShadow }
        return $skin
    }

    if ($luma -gt 190) { return $white }
    if ($luma -lt 92) { return $hair }
    return $hairLight
}

$normalized = @()
$frames = @()
try {
    $sourceCellWidth = [int]($sourceBitmap.Width / 4)

    for ($frameIndex = 0; $frameIndex -lt 4; $frameIndex++) {
        $frame = New-Object System.Drawing.Bitmap 48, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        for ($y = 0; $y -lt 64; $y++) {
            $sourceY = [Math]::Min($sourceBitmap.Height - 1, [int][Math]::Floor((($y + 0.5) * $sourceBitmap.Height) / 64))
            for ($x = 0; $x -lt 48; $x++) {
                $sourceLocalX = [int][Math]::Floor((($x + 0.5) * $sourceCellWidth) / 48)
                $sourceX = [Math]::Min($sourceBitmap.Width - 1, ($frameIndex * $sourceCellWidth) + $sourceLocalX)
                $frame.SetPixel($x, $y, (Convert-Pixel $sourceBitmap.GetPixel($sourceX, $sourceY)))
            }
        }
        $normalized += $frame
    }

    # Start every state from the exact neutral portrait. This guarantees that
    # hair, mask outline, face contour, clothes, and framing cannot drift.
    for ($frameIndex = 0; $frameIndex -lt 4; $frameIndex++) {
        $frame = New-Object System.Drawing.Bitmap 48, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [System.Drawing.Graphics]::FromImage($frame)
        try {
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.DrawImageUnscaled($normalized[0], 0, 0)
        } finally { $graphics.Dispose() }
        $frames += $frame
    }

    # Talk A and Talk B: replace only the small mouth patch.
    for ($frameIndex = 1; $frameIndex -le 2; $frameIndex++) {
        for ($y = 38; $y -le 44; $y++) {
            for ($x = 17; $x -le 30; $x++) {
                $frames[$frameIndex].SetPixel($x, $y, $normalized[$frameIndex].GetPixel($x, $y))
            }
        }
    }

    # Blink: replace only two tight eye boxes; keep the mask silhouette,
    # center spot, face, and neutral mouth untouched.
    for ($y = 27; $y -le 36; $y++) {
        for ($x = 9; $x -le 19; $x++) {
            $frames[3].SetPixel($x, $y, $normalized[3].GetPixel($x, $y))
        }
        for ($x = 28; $x -le 39; $x++) {
            $frames[3].SetPixel($x, $y, $normalized[3].GetPixel($x, $y))
        }
    }

    $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
    try {
        $sheetGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        for ($frameIndex = 0; $frameIndex -lt 4; $frameIndex++) {
            $sheetGraphics.DrawImageUnscaled($frames[$frameIndex], $frameIndex * 48, 0)
        }
    } finally { $sheetGraphics.Dispose() }

    $outputDirectory = Split-Path -Parent $Output
    if ($outputDirectory) { [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null }
    $sheet.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap = New-Object System.Drawing.Bitmap 768, 256, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.DrawImage($sheet, 0, 0, 768, 256)
            } finally { $previewGraphics.Dispose() }
            $previewBitmap.Save($Preview, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $previewBitmap.Dispose() }
    }
} finally {
    foreach ($frame in $frames) { $frame.Dispose() }
    foreach ($frame in $normalized) { $frame.Dispose() }
    $sheet.Dispose()
    $sourceBitmap.Dispose()
}
