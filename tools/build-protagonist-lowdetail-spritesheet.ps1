param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [Parameter(Mandatory = $true)]
    [string]$Preview,

    [ValidateSet('woman', 'man')]
    [string]$PalettePreset = 'woman',

    [switch]$LockIdleFeet
)

Add-Type -AssemblyName System.Drawing

if ($PalettePreset -eq 'man') {
    $paletteHex = @(
        '#FF00FF', '#241A1B', '#17191D', '#303238', '#70442F', '#935B3A',
        '#B87548', '#CF8B59', '#111820', '#283448', '#8263A8', '#F4F2E8',
        '#E1E3DF', '#BBC0C2', '#25292E', '#3A3F45', '#92999E', '#5A2B25'
    )
}
else {
    $paletteHex = @(
        '#FF00FF', '#2A1A16', '#1E1512', '#3F2C25', '#B87A55', '#8F5A3C',
        '#E2B95C', '#EAF2F6', '#232A2F', '#B7BEC4', '#8E969D', '#2A2320'
    )
}

$palette = @($paletteHex | ForEach-Object { [System.Drawing.ColorTranslator]::FromHtml($_) })

$magenta = [System.Drawing.ColorTranslator]::FromHtml('#FF00FF')

function Get-NearestPaletteColor([System.Drawing.Color]$color) {
    $nearest = $palette[0]
    $bestDistance = [double]::PositiveInfinity
    foreach ($candidate in $palette) {
        $r = [int]$color.R - [int]$candidate.R
        $g = [int]$color.G - [int]$candidate.G
        $b = [int]$color.B - [int]$candidate.B
        $distance = ($r * $r) + ($g * $g) + ($b * $b)
        if ($distance -lt $bestDistance) {
            $bestDistance = $distance
            $nearest = $candidate
        }
    }
    return [System.Drawing.Color]::FromArgb(255, $nearest.R, $nearest.G, $nearest.B)
}

function Convert-ToPalette([System.Drawing.Bitmap]$bitmap) {
    for ($y = 0; $y -lt $bitmap.Height; $y++) {
        for ($x = 0; $x -lt $bitmap.Width; $x++) {
            $bitmap.SetPixel($x, $y, (Get-NearestPaletteColor $bitmap.GetPixel($x, $y)))
        }
    }
}

function Get-LogicalBounds([System.Drawing.Bitmap]$bitmap) {
    $minX = $bitmap.Width
    $minY = $bitmap.Height
    $maxX = -1
    $maxY = -1
    for ($y = 0; $y -lt $bitmap.Height; $y++) {
        for ($x = 0; $x -lt $bitmap.Width; $x++) {
            if ($bitmap.GetPixel($x, $y).ToArgb() -ne $magenta.ToArgb()) {
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

function New-LogicalCell(
    [System.Drawing.Bitmap]$source,
    [int]$column,
    [int]$row
) {
    $cell = New-Object System.Drawing.Bitmap 64, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($cell)
    try {
        $graphics.Clear($magenta)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

        $left = [int][Math]::Round($column * $source.Width / 6.0)
        $right = [int][Math]::Round(($column + 1) * $source.Width / 6.0)
        $top = [int][Math]::Round($row * $source.Height / 2.0)
        $bottom = [int][Math]::Round(($row + 1) * $source.Height / 2.0)
        $graphics.DrawImage(
            $source,
            (New-Object System.Drawing.Rectangle 0, 0, 64, 64),
            (New-Object System.Drawing.Rectangle $left, $top, ($right - $left), ($bottom - $top)),
            [System.Drawing.GraphicsUnit]::Pixel
        )
    }
    finally {
        $graphics.Dispose()
    }
    Convert-ToPalette $cell
    return $cell
}

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$sheet = New-Object System.Drawing.Bitmap 384, 128, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cells = @()

try {
    $master = New-LogicalCell $sourceBitmap 0 0
    $masterBounds = Get-LogicalBounds $master
    if ($null -eq $masterBounds) {
        throw 'No character detected in first idle cell.'
    }
    $scale = [Math]::Min(30.0 / $masterBounds.Height, 22.0 / $masterBounds.Width)

    $graphics = [System.Drawing.Graphics]::FromImage($sheet)
    try {
        $graphics.Clear($magenta)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

        for ($row = 0; $row -lt 2; $row++) {
            for ($column = 0; $column -lt 6; $column++) {
                if ($row -eq 0 -and $column -ge 4) {
                    continue
                }
                $cell = New-LogicalCell $sourceBitmap $column $row
                $cells += $cell
                $bounds = Get-LogicalBounds $cell
                if ($null -eq $bounds) {
                    continue
                }
                $width = [Math]::Max(1, [int][Math]::Round($bounds.Width * $scale))
                $height = [Math]::Max(1, [int][Math]::Round($bounds.Height * $scale))
                $x = ($column * 64) + [int][Math]::Floor((64 - $width) / 2.0)
                $y = ($row * 64) + 49 - $height
                $graphics.DrawImage(
                    $cell,
                    (New-Object System.Drawing.Rectangle $x, $y, $width, $height),
                    $bounds,
                    [System.Drawing.GraphicsUnit]::Pixel
                )
            }
        }
    }
    finally {
        $graphics.Dispose()
    }

    Convert-ToPalette $sheet
    for ($y = 0; $y -lt 64; $y++) {
        for ($x = 256; $x -lt 384; $x++) {
            $sheet.SetPixel($x, $y, $magenta)
        }
    }
    if ($LockIdleFeet) {
        for ($column = 1; $column -le 3; $column++) {
            for ($y = 44; $y -le 48; $y++) {
                for ($x = 0; $x -lt 64; $x++) {
                    $sheet.SetPixel(($column * 64) + $x, $y, $sheet.GetPixel($x, $y))
                }
            }
        }
    }
    # Run a final canonicalization pass after all drawing operations so the
    # exported PNG contains only exact, fully opaque palette entries.
    Convert-ToPalette $sheet

    $directory = Split-Path -Parent $Output
    if ($directory) {
        [System.IO.Directory]::CreateDirectory($directory) | Out-Null
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
    foreach ($cell in $cells) {
        $cell.Dispose()
    }
    $master.Dispose()
    $sheet.Dispose()
    $sourceBitmap.Dispose()
}
