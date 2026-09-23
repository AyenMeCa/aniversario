param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

# Deliberately short palette: background + outline, hair/leather, skin,
# teal clothing, trousers and one light accent.
$paletteHex = @(
    '#FF00FF', '#2B1917', '#4A291D', '#7B4527', '#A85F3B',
    '#E39A63', '#F2B77C', '#164D54', '#2D7478', '#39302D', '#E8DDC8'
)
$palette = @($paletteHex | ForEach-Object { [System.Drawing.ColorTranslator]::FromHtml($_) })
$magenta = $palette[0]

function Get-NearestColor([System.Drawing.Color]$color) {
    if ($color.A -eq 0) { return $magenta }
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

function Get-FrameBounds([System.Drawing.Bitmap]$bitmap) {
    $minX = 64; $minY = 64; $maxX = -1; $maxY = -1
    for ($y = 0; $y -lt 64; $y++) {
        for ($x = 0; $x -lt 64; $x++) {
            if ($bitmap.GetPixel($x, $y).ToArgb() -ne $magenta.ToArgb()) {
                $minX = [Math]::Min($minX, $x); $minY = [Math]::Min($minY, $y)
                $maxX = [Math]::Max($maxX, $x); $maxY = [Math]::Max($maxY, $y)
            }
        }
    }
    if ($maxX -lt 0) { return $null }
    return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX-$minX+1), ($maxY-$minY+1)
}

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$base = New-Object System.Drawing.Bitmap 64, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$sheet = New-Object System.Drawing.Bitmap 256, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    $bounds = Get-FrameBounds $sourceBitmap
    if ($null -eq $bounds) { throw 'No character detected in the first 64x64 frame.' }

    $baseGraphics = [System.Drawing.Graphics]::FromImage($base)
    try {
        $baseGraphics.Clear($magenta)
        $baseGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $baseGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $baseGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $baseGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
        # Smaller and chunkier than the previous version: 14x27 logical pixels.
        $baseGraphics.DrawImage(
            $sourceBitmap,
            (New-Object System.Drawing.Rectangle 25, 22, 14, 27),
            $bounds,
            [System.Drawing.GraphicsUnit]::Pixel
        )
    } finally { $baseGraphics.Dispose() }
    Convert-ToPalette $base

    $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
    try { $sheetGraphics.Clear($magenta) } finally { $sheetGraphics.Dispose() }

    $offsets = @(0, 1, 2, 1)
    $top = 22
    $waist = 42
    $bottom = 48

    for ($frame = 0; $frame -lt 4; $frame++) {
        $frameX = $frame * 64
        $offset = $offsets[$frame]

        # Legs and feet remain pixel-identical in every frame.
        for ($y = $waist; $y -le $bottom; $y++) {
            for ($x = 0; $x -lt 64; $x++) {
                $sheet.SetPixel($frameX + $x, $y, $base.GetPixel($x, $y))
            }
        }

        # Only head, hair, arms and torso move: 0/1/2/1 pixels upward.
        for ($y = $top; $y -lt $waist; $y++) {
            for ($x = 0; $x -lt 64; $x++) {
                $sheet.SetPixel($frameX + $x, $y - $offset, $base.GetPixel($x, $y))
            }
        }

        # Close the waist seam without moving the legs.
        for ($gap = 1; $gap -le $offset; $gap++) {
            for ($x = 0; $x -lt 64; $x++) {
                $sheet.SetPixel($frameX + $x, $waist - $gap, $base.GetPixel($x, $waist - 1))
            }
        }
    }

    Convert-ToPalette $sheet
    $sheet.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap = New-Object System.Drawing.Bitmap 2048, 512, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.DrawImage($sheet, 0, 0, 2048, 512)
            } finally { $previewGraphics.Dispose() }
            $previewBitmap.Save($Preview, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $previewBitmap.Dispose() }
    }
} finally {
    $sheet.Dispose(); $base.Dispose(); $sourceBitmap.Dispose()
}
