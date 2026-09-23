param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

$paletteHex = @(
    '#FF00FF', '#241A1B', '#17191D', '#343238', '#70442F', '#A9653A',
    '#CF8B59', '#111820', '#8263A8', '#F4F2E8', '#BBC0C2', '#3A3F45'
)
$palette = @($paletteHex | ForEach-Object { [System.Drawing.ColorTranslator]::FromHtml($_) })
$magenta = $palette[0]

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

function Get-CharacterBounds([System.Drawing.Bitmap]$bitmap) {
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
    if ($maxX -lt $minX) { return $null }
    return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}

function Get-SourceCell([System.Drawing.Bitmap]$source, [int]$column, [int]$row) {
    $cell = New-Object System.Drawing.Bitmap 64, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($cell)
    try {
        $graphics.Clear($magenta)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
        $sourceLeft = [int][Math]::Round($column * $source.Width / 6.0)
        $sourceRight = [int][Math]::Round(($column + 1) * $source.Width / 6.0)
        $sourceTop = [int][Math]::Round($row * $source.Height / 2.0)
        $sourceBottom = [int][Math]::Round(($row + 1) * $source.Height / 2.0)
        $graphics.DrawImage(
            $source,
            (New-Object System.Drawing.Rectangle 0, 0, 64, 64),
            (New-Object System.Drawing.Rectangle $sourceLeft, $sourceTop, ($sourceRight - $sourceLeft), ($sourceBottom - $sourceTop)),
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
    $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
    try {
        $sheetGraphics.Clear($magenta)
        $sheetGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $sheetGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $sheetGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $sheetGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

        for ($row = 0; $row -lt 2; $row++) {
            for ($column = 0; $column -lt 6; $column++) {
                if ($row -eq 0 -and $column -ge 4) { continue }
                $cell = Get-SourceCell $sourceBitmap $column $row
                $cells += $cell
                $bounds = Get-CharacterBounds $cell
                if ($null -eq $bounds) { continue }

                $targetWidth = 17
                $targetHeight = 27
                $targetX = ($column * 64) + [int][Math]::Floor((64 - $targetWidth) / 2.0)
                $targetY = ($row * 64) + 49 - $targetHeight
                $sheetGraphics.DrawImage(
                    $cell,
                    (New-Object System.Drawing.Rectangle $targetX, $targetY, $targetWidth, $targetHeight),
                    $bounds,
                    [System.Drawing.GraphicsUnit]::Pixel
                )
            }
        }
    }
    finally {
        $sheetGraphics.Dispose()
    }

    Convert-ToPalette $sheet
    for ($y = 0; $y -lt 64; $y++) {
        for ($x = 256; $x -lt 384; $x++) {
            $sheet.SetPixel($x, $y, $magenta)
        }
    }
    $sheet.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap = New-Object System.Drawing.Bitmap 3072, 1024, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.DrawImage($sheet, 0, 0, 3072, 1024)
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
    foreach ($cell in $cells) { $cell.Dispose() }
    $sheet.Dispose()
    $sourceBitmap.Dispose()
}
