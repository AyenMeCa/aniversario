param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview,

    [switch]$NormalizeDarkBackground
)

Add-Type -AssemblyName System.Drawing

$paletteHex = @(
    '#FF00FF', '#2B1917', '#3B211B', '#70401F', '#A66730', '#9B5235',
    '#C66E42', '#E38A55', '#F3B075', '#F4E5CD', '#607833', '#154A51',
    '#286C73', '#4D8F94', '#6A351F', '#7C3331'
)
$palette = @($paletteHex | ForEach-Object { [System.Drawing.ColorTranslator]::FromHtml($_) })

function Get-NearestColor([System.Drawing.Color]$color) {
    $nearest = $palette[0]
    $best = [double]::PositiveInfinity
    foreach ($candidate in $palette) {
        $dr = [int]$color.R - [int]$candidate.R
        $dg = [int]$color.G - [int]$candidate.G
        $db = [int]$color.B - [int]$candidate.B
        $distance = ($dr * $dr) + ($dg * $dg) + ($db * $db)
        if ($distance -lt $best) {
            $best = $distance
            $nearest = $candidate
        }
    }
    return [System.Drawing.Color]::FromArgb(255, $nearest.R, $nearest.G, $nearest.B)
}

function Convert-ToPalette([System.Drawing.Bitmap]$bitmap) {
    for ($y = 0; $y -lt $bitmap.Height; $y++) {
        for ($x = 0; $x -lt $bitmap.Width; $x++) {
            $bitmap.SetPixel($x, $y, (Get-NearestColor $bitmap.GetPixel($x, $y)))
        }
    }
}

function Convert-DarkBackgroundToMagenta([System.Drawing.Bitmap]$bitmap) {
    $magenta = [System.Drawing.ColorTranslator]::FromHtml('#FF00FF')
    $backgroundArgb = $bitmap.GetPixel(0, 0).ToArgb()
    $visited = New-Object 'bool[,]' $bitmap.Width, $bitmap.Height
    $queue = New-Object 'System.Collections.Generic.Queue[System.Drawing.Point]'
    $queue.Enqueue((New-Object System.Drawing.Point 0, 0))

    while ($queue.Count -gt 0) {
        $point = $queue.Dequeue()
        if ($point.X -lt 0 -or $point.Y -lt 0 -or $point.X -ge $bitmap.Width -or $point.Y -ge $bitmap.Height) { continue }
        if ($visited[$point.X, $point.Y]) { continue }
        $visited[$point.X, $point.Y] = $true
        if ($bitmap.GetPixel($point.X, $point.Y).ToArgb() -ne $backgroundArgb) { continue }

        $bitmap.SetPixel($point.X, $point.Y, $magenta)
        $queue.Enqueue((New-Object System.Drawing.Point ($point.X - 1), $point.Y))
        $queue.Enqueue((New-Object System.Drawing.Point ($point.X + 1), $point.Y))
        $queue.Enqueue((New-Object System.Drawing.Point $point.X, ($point.Y - 1)))
        $queue.Enqueue((New-Object System.Drawing.Point $point.X, ($point.Y + 1)))
    }

    # Also normalize any separate border-connected background islands.
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
        foreach ($y in @(0, ($bitmap.Height - 1))) {
            if ($bitmap.GetPixel($x, $y).ToArgb() -eq $backgroundArgb) {
                $bitmap.SetPixel($x, $y, $magenta)
            }
        }
    }
    for ($y = 0; $y -lt $bitmap.Height; $y++) {
        foreach ($x in @(0, ($bitmap.Width - 1))) {
            if ($bitmap.GetPixel($x, $y).ToArgb() -eq $backgroundArgb) {
                $bitmap.SetPixel($x, $y, $magenta)
            }
        }
    }
}

function Copy-Region(
    [System.Drawing.Bitmap]$source,
    [System.Drawing.Bitmap]$destination,
    [int]$sourceCell,
    [int]$destinationCell,
    [System.Drawing.Rectangle]$region
) {
    for ($y = $region.Top; $y -lt $region.Bottom; $y++) {
        for ($x = $region.Left; $x -lt $region.Right; $x++) {
            $color = $source.GetPixel(($sourceCell * 48) + $x, $y)
            $destination.SetPixel(($destinationCell * 48) + $x, $y, $color)
        }
    }
}

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$scaled = New-Object System.Drawing.Bitmap 192, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$final = New-Object System.Drawing.Bitmap 192, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    $graphics = [System.Drawing.Graphics]::FromImage($scaled)
    try {
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
        $graphics.DrawImage(
            $sourceBitmap,
            (New-Object System.Drawing.Rectangle 0, 0, 192, 64),
            (New-Object System.Drawing.Rectangle 0, 0, $sourceBitmap.Width, $sourceBitmap.Height),
            [System.Drawing.GraphicsUnit]::Pixel
        )
    }
    finally {
        $graphics.Dispose()
    }
    if ($NormalizeDarkBackground) {
        Convert-DarkBackgroundToMagenta $scaled
    }
    Convert-ToPalette $scaled

    # Start every frame from the exact neutral portrait.
    for ($cell = 0; $cell -lt 4; $cell++) {
        for ($y = 0; $y -lt 64; $y++) {
            for ($x = 0; $x -lt 48; $x++) {
                $final.SetPixel(($cell * 48) + $x, $y, $scaled.GetPixel($x, $y))
            }
        }
    }

    # Only these facial regions are allowed to change.
    $mouthRegion = New-Object System.Drawing.Rectangle 17, 29, 19, 11
    $eyeRegion = New-Object System.Drawing.Rectangle 8, 19, 32, 11
    Copy-Region $scaled $final 1 1 $mouthRegion
    Copy-Region $scaled $final 2 2 $mouthRegion
    Copy-Region $scaled $final 3 3 $eyeRegion
    Convert-ToPalette $final

    $outputDirectory = Split-Path -Parent $Output
    if ($outputDirectory) {
        [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
    }
    $final.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap = New-Object System.Drawing.Bitmap 1536, 512, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.DrawImage($final, 0, 0, 1536, 512)
            }
            finally {
                $previewGraphics.Dispose()
            }
            $previewBitmap.Save($Preview, [System.Drawing.Imaging.ImageFormat]::Png)
        }
        finally {
            $previewBitmap.Dispose()
        }
    }
}
finally {
    $final.Dispose()
    $scaled.Dispose()
    $sourceBitmap.Dispose()
}
