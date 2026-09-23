param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

# Exactly 24 colors for the complete scene.
$paletteHex = @(
    '#251C24', '#3B2B31', '#5B3D3B', '#5A2828', '#81392E', '#AA4F34',
    '#D17646', '#844531', '#AD6044', '#D17E58', '#E99D6F', '#F1B487',
    '#23483B', '#356143', '#4F7F43', '#70A34A', '#9BC35A', '#70B6DC',
    '#1D2947', '#314267', '#4A5E7F', '#EFE8D8', '#87364F', '#D9484F'
)
$palette = @($paletteHex | ForEach-Object { [System.Drawing.ColorTranslator]::FromHtml($_) })

function Get-NearestColor([System.Drawing.Color]$color) {
    $nearest = $palette[0]
    $best = [double]::PositiveInfinity
    foreach ($candidate in $palette) {
        $dr = [int]$color.R - [int]$candidate.R
        $dg = [int]$color.G - [int]$candidate.G
        $db = [int]$color.B - [int]$candidate.B
        $distance = ($dr*$dr) + ($dg*$dg) + ($db*$db)
        if ($distance -lt $best) {
            $best = $distance
            $nearest = $candidate
        }
    }
    return [System.Drawing.Color]::FromArgb(255, $nearest.R, $nearest.G, $nearest.B)
}

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$final = New-Object System.Drawing.Bitmap 160, 90, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    # Crop to 16:9 around the generated composition before the one-step reduction.
    $targetRatio = 16.0 / 9.0
    $sourceWidth = $sourceBitmap.Width
    $sourceHeight = [int][Math]::Floor($sourceWidth / $targetRatio)
    if ($sourceHeight -gt $sourceBitmap.Height) {
        $sourceHeight = $sourceBitmap.Height
        $sourceWidth = [int][Math]::Floor($sourceHeight * $targetRatio)
    }
    $sourceX = [int][Math]::Floor(($sourceBitmap.Width - $sourceWidth) / 2)
    $sourceY = [int][Math]::Floor(($sourceBitmap.Height - $sourceHeight) / 2)

    $graphics = [System.Drawing.Graphics]::FromImage($final)
    try {
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.DrawImage(
            $sourceBitmap,
            (New-Object System.Drawing.Rectangle 0, 0, 160, 90),
            (New-Object System.Drawing.Rectangle $sourceX, $sourceY, $sourceWidth, $sourceHeight),
            [System.Drawing.GraphicsUnit]::Pixel
        )
    } finally { $graphics.Dispose() }

    # One palette lookup per logical pixel: no gradients, blur, or hidden colors survive.
    for ($y=0; $y -lt $final.Height; $y++) {
        for ($x=0; $x -lt $final.Width; $x++) {
            $final.SetPixel($x, $y, (Get-NearestColor $final.GetPixel($x, $y)))
        }
    }

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
    $final.Dispose(); $sourceBitmap.Dispose()
}
