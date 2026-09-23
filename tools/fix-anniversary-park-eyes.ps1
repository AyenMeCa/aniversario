param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$final = New-Object System.Drawing.Bitmap $sourceBitmap.Width, $sourceBitmap.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    $graphics = [System.Drawing.Graphics]::FromImage($final)
    try {
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.DrawImageUnscaled($sourceBitmap, 0, 0)
    } finally { $graphics.Dispose() }

    # Simplify the man's eyes to matching two-pixel dark-brown marks. The
    # surrounding pixels reuse existing skin tones so no new palette colors
    # are introduced and the eyebrows remain unchanged.
    $skinShadow = [System.Drawing.ColorTranslator]::FromHtml('#D17E58')
    $eye = [System.Drawing.ColorTranslator]::FromHtml('#3B2B31')

    $final.SetPixel(122, 26, $skinShadow)
    $final.SetPixel(123, 26, $eye)
    $final.SetPixel(124, 26, $eye)

    $final.SetPixel(129, 26, $skinShadow)
    $final.SetPixel(130, 26, $eye)
    $final.SetPixel(131, 26, $eye)

    $outputDirectory = Split-Path -Parent $Output
    if ($outputDirectory) { [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null }
    $final.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap = New-Object System.Drawing.Bitmap 640, 360, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.DrawImage($final, 0, 0, 640, 360)
            } finally { $previewGraphics.Dispose() }
            $previewBitmap.Save($Preview, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $previewBitmap.Dispose() }
    }
} finally {
    $final.Dispose()
    $sourceBitmap.Dispose()
}
