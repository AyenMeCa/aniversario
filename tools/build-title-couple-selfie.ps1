param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

$paletteHex = @(
    '#FF00FF', '#2B1B1D', '#3A2022', '#5B2B24', '#7D3928',
    '#A84E31', '#CE6B41', '#E18A59', '#814434', '#A65E43',
    '#C97B58', '#E29B70', '#F1B489', '#F8C9A0', '#A94F5E',
    '#E58C92', '#FFF0D6', '#C9A24C', '#E7C46C', '#1D2638', '#354565',
    '#E9E4D9'
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
$final = New-Object System.Drawing.Bitmap 160, 96, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    $graphics = [System.Drawing.Graphics]::FromImage($final)
    try {
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.DrawImage(
            $sourceBitmap,
            (New-Object System.Drawing.Rectangle 0, 0, 160, 96),
            (New-Object System.Drawing.Rectangle 0, 0, $sourceBitmap.Width, $sourceBitmap.Height),
            [System.Drawing.GraphicsUnit]::Pixel
        )
    } finally { $graphics.Dispose() }

    for ($y=0; $y -lt $final.Height; $y++) {
        for ($x=0; $x -lt $final.Width; $x++) {
            $final.SetPixel($x, $y, (Get-NearestColor $final.GetPixel($x, $y)))
        }
    }

    $outputDirectory = Split-Path -Parent $Output
    if ($outputDirectory) { [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null }
    $final.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap = New-Object System.Drawing.Bitmap 640, 384, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.DrawImage($final, 0, 0, 640, 384)
            } finally { $previewGraphics.Dispose() }
            $previewBitmap.Save($Preview, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $previewBitmap.Dispose() }
    }
} finally {
    $final.Dispose(); $sourceBitmap.Dispose()
}
