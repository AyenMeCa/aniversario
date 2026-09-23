param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [Parameter(Mandatory = $true)]
    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

$palette = @(
    [System.Drawing.ColorTranslator]::FromHtml('#FF00FF'),
    [System.Drawing.ColorTranslator]::FromHtml('#2A1A16'),
    [System.Drawing.ColorTranslator]::FromHtml('#1E1512'),
    [System.Drawing.ColorTranslator]::FromHtml('#3F2C25'),
    [System.Drawing.ColorTranslator]::FromHtml('#B87A55'),
    [System.Drawing.ColorTranslator]::FromHtml('#8F5A3C'),
    [System.Drawing.ColorTranslator]::FromHtml('#D39A72'),
    [System.Drawing.ColorTranslator]::FromHtml('#9A5A55'),
    [System.Drawing.ColorTranslator]::FromHtml('#E2B95C'),
    [System.Drawing.ColorTranslator]::FromHtml('#B98A3A'),
    [System.Drawing.ColorTranslator]::FromHtml('#EAF2F6'),
    [System.Drawing.ColorTranslator]::FromHtml('#232A2F'),
    [System.Drawing.ColorTranslator]::FromHtml('#3C464D'),
    [System.Drawing.ColorTranslator]::FromHtml('#F0C674'),
    [System.Drawing.ColorTranslator]::FromHtml('#B7BEC4'),
    [System.Drawing.ColorTranslator]::FromHtml('#8E969D'),
    [System.Drawing.ColorTranslator]::FromHtml('#D6DBDF'),
    [System.Drawing.ColorTranslator]::FromHtml('#2A2320')
)

$magenta = [System.Drawing.ColorTranslator]::FromHtml('#FF00FF')

function Test-IsBackground([System.Drawing.Color]$color) {
    return $color.R -ge 215 -and $color.B -ge 170 -and $color.G -le 90
}

function Get-NearestPaletteColor([System.Drawing.Color]$color) {
    $nearest = $palette[0]
    $bestDistance = [double]::PositiveInfinity

    foreach ($candidate in $palette) {
        $red = [int]$color.R - [int]$candidate.R
        $green = [int]$color.G - [int]$candidate.G
        $blue = [int]$color.B - [int]$candidate.B
        $distance = ($red * $red) + ($green * $green) + ($blue * $blue)
        if ($distance -lt $bestDistance) {
            $bestDistance = $distance
            $nearest = $candidate
        }
    }

    return $nearest
}

function Get-CharacterBounds(
    [System.Drawing.Bitmap]$bitmap,
    [int]$left,
    [int]$top,
    [int]$width,
    [int]$height
) {
    $minX = $left + $width
    $minY = $top + $height
    $maxX = -1
    $maxY = -1

    for ($y = $top; $y -lt ($top + $height); $y++) {
        for ($x = $left; $x -lt ($left + $width); $x++) {
            if (-not (Test-IsBackground $bitmap.GetPixel($x, $y))) {
                $minX = [Math]::Min($minX, $x)
                $minY = [Math]::Min($minY, $y)
                $maxX = [Math]::Max($maxX, $x)
                $maxY = [Math]::Max($maxY, $y)
            }
        }
    }

    if ($maxX -lt $minX -or $maxY -lt $minY) {
        return $null
    }

    return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$sheet = New-Object System.Drawing.Bitmap 384, 128, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    $sourceCellWidth = [int][Math]::Round($sourceBitmap.Width / 6.0)
    $sourceCellHeight = [int][Math]::Round($sourceBitmap.Height / 2.0)
    $masterBounds = Get-CharacterBounds $sourceBitmap 0 0 $sourceCellWidth $sourceCellHeight
    if ($null -eq $masterBounds) {
        throw 'No character was detected in the first idle cell.'
    }

    $scale = [Math]::Min(30.0 / $masterBounds.Height, 26.0 / $masterBounds.Width)

    $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
    try {
        $sheetGraphics.Clear($magenta)
        $sheetGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $sheetGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $sheetGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $sheetGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

        for ($row = 0; $row -lt 2; $row++) {
            for ($column = 0; $column -lt 6; $column++) {
                if ($row -eq 0 -and $column -ge 4) {
                    continue
                }

                $sourceLeft = [int][Math]::Round($column * $sourceBitmap.Width / 6.0)
                $sourceRight = [int][Math]::Round(($column + 1) * $sourceBitmap.Width / 6.0)
                $sourceTop = [int][Math]::Round($row * $sourceBitmap.Height / 2.0)
                $sourceBottom = [int][Math]::Round(($row + 1) * $sourceBitmap.Height / 2.0)
                $bounds = Get-CharacterBounds $sourceBitmap $sourceLeft $sourceTop ($sourceRight - $sourceLeft) ($sourceBottom - $sourceTop)
                if ($null -eq $bounds) {
                    continue
                }

                $destinationWidth = [Math]::Max(1, [int][Math]::Round($bounds.Width * $scale))
                $destinationHeight = [Math]::Max(1, [int][Math]::Round($bounds.Height * $scale))
                $destinationX = ($column * 64) + [int][Math]::Floor((64 - $destinationWidth) / 2.0)
                $destinationY = ($row * 64) + 49 - $destinationHeight

                $sheetGraphics.DrawImage(
                    $sourceBitmap,
                    (New-Object System.Drawing.Rectangle $destinationX, $destinationY, $destinationWidth, $destinationHeight),
                    $bounds,
                    [System.Drawing.GraphicsUnit]::Pixel
                )
            }
        }
    }
    finally {
        $sheetGraphics.Dispose()
    }

    for ($y = 0; $y -lt 128; $y++) {
        for ($x = 0; $x -lt 384; $x++) {
            $sheet.SetPixel($x, $y, (Get-NearestPaletteColor $sheet.GetPixel($x, $y)))
        }
    }

    # Enforce the two intentionally empty idle cells after quantization.
    for ($y = 0; $y -lt 64; $y++) {
        for ($x = 256; $x -lt 384; $x++) {
            $sheet.SetPixel($x, $y, $magenta)
        }
    }

    $outputDirectory = Split-Path -Parent $Output
    if ($outputDirectory) {
        [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
    }
    $sheet.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    $previewBitmap = New-Object System.Drawing.Bitmap 3072, 1024, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
        try {
            $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
            $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
            $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
            $previewGraphics.DrawImage(
                $sheet,
                (New-Object System.Drawing.Rectangle 0, 0, 3072, 1024),
                (New-Object System.Drawing.Rectangle 0, 0, 384, 128),
                [System.Drawing.GraphicsUnit]::Pixel
            )
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
finally {
    $sheet.Dispose()
    $sourceBitmap.Dispose()
}
