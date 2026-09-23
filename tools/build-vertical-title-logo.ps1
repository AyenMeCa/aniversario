param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$final = New-Object System.Drawing.Bitmap 90, 160, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$magenta = [System.Drawing.ColorTranslator]::FromHtml('#FF00FF')
$outline = [System.Drawing.ColorTranslator]::FromHtml('#3A2118')
$gold = [System.Drawing.ColorTranslator]::FromHtml('#D69A27')
$cream = [System.Drawing.ColorTranslator]::FromHtml('#FFF0B8')

try {
    # Sample the generated composition down to its true logical resolution.
    # Each output pixel is then assigned to one of four exact palette colors,
    # removing all generated gradients, antialiasing, and background noise.
    for ($y = 0; $y -lt $final.Height; $y++) {
        $sourceY = [Math]::Min($sourceBitmap.Height - 1, [int][Math]::Floor((($y + 0.5) * $sourceBitmap.Height) / $final.Height))
        for ($x = 0; $x -lt $final.Width; $x++) {
            $sourceX = [Math]::Min($sourceBitmap.Width - 1, [int][Math]::Floor((($x + 0.5) * $sourceBitmap.Width) / $final.Width))
            $pixel = $sourceBitmap.GetPixel($sourceX, $sourceY)

            if ($pixel.R -gt 160 -and $pixel.B -gt 150 -and $pixel.G -lt 100 -and ($pixel.R + $pixel.B) -gt 360) {
                $mapped = $magenta
            } else {
                $luma = (0.299 * $pixel.R) + (0.587 * $pixel.G) + (0.114 * $pixel.B)
                if ($luma -lt 105) {
                    $mapped = $outline
                } elseif ($luma -lt 205 -or $pixel.B -lt 120) {
                    $mapped = $gold
                } else {
                    $mapped = $cream
                }
            }

            $final.SetPixel($x, $y, $mapped)
        }
    }

    $outputDirectory = Split-Path -Parent $Output
    if ($outputDirectory) { [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null }
    $final.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap = New-Object System.Drawing.Bitmap 360, 640, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.DrawImage($final, 0, 0, 360, 640)
            } finally { $previewGraphics.Dispose() }
            $previewBitmap.Save($Preview, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $previewBitmap.Dispose() }
    }
} finally {
    $final.Dispose()
    $sourceBitmap.Dispose()
}
