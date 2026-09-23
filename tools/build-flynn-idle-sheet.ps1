param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

$paletteHex = @(
    '#FF00FF', '#2B1917', '#3B211B', '#70401F', '#A66730', '#9B5235',
    '#C66E42', '#F3B075', '#607833', '#154A51', '#286C73', '#4D8F94',
    '#6A351F', '#D79A2B', '#3A2E2A', '#F4E5CD'
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

function Get-Bounds([System.Drawing.Bitmap]$bitmap) {
    $minX=$bitmap.Width; $minY=$bitmap.Height; $maxX=-1; $maxY=-1
    for ($y=0; $y -lt $bitmap.Height; $y++) {
        for ($x=0; $x -lt $bitmap.Width; $x++) {
            if ($bitmap.GetPixel($x,$y).ToArgb() -ne $magenta.ToArgb()) {
                $minX=[Math]::Min($minX,$x); $minY=[Math]::Min($minY,$y)
                $maxX=[Math]::Max($maxX,$x); $maxY=[Math]::Max($maxY,$y)
            }
        }
    }
    if ($maxX -lt 0) { return $null }
    return New-Object System.Drawing.Rectangle $minX,$minY,($maxX-$minX+1),($maxY-$minY+1)
}

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$logical = New-Object System.Drawing.Bitmap 64,64,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$base = New-Object System.Drawing.Bitmap 64,64,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$sheet = New-Object System.Drawing.Bitmap 256,64,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    $logicalGraphics=[System.Drawing.Graphics]::FromImage($logical)
    try {
        $logicalGraphics.Clear($magenta)
        $logicalGraphics.CompositingMode=[System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $logicalGraphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $logicalGraphics.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $logicalGraphics.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::None
        $logicalGraphics.DrawImage($sourceBitmap,0,0,64,64)
    } finally { $logicalGraphics.Dispose() }
    Convert-ToPalette $logical
    $bounds=Get-Bounds $logical
    if ($null -eq $bounds) { throw 'No character detected.' }

    $baseGraphics=[System.Drawing.Graphics]::FromImage($base)
    try {
        $baseGraphics.Clear($magenta)
        $baseGraphics.CompositingMode=[System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $baseGraphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $baseGraphics.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $baseGraphics.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::None
        $baseGraphics.DrawImage(
            $logical,
            (New-Object System.Drawing.Rectangle 23,19,18,30),
            $bounds,
            [System.Drawing.GraphicsUnit]::Pixel
        )
    } finally { $baseGraphics.Dispose() }
    Convert-ToPalette $base

    $sheetGraphics=[System.Drawing.Graphics]::FromImage($sheet)
    try { $sheetGraphics.Clear($magenta) } finally { $sheetGraphics.Dispose() }
    $offsets=@(0,1,2,1)
    $top=19
    $waist=41
    $bottom=48

    for ($frame=0; $frame -lt 4; $frame++) {
        $frameX=$frame*64
        $offset=$offsets[$frame]

        # Legs and boots are copied pixel-identically without vertical movement.
        for ($y=$waist; $y -le $bottom; $y++) {
            for ($x=0; $x -lt 64; $x++) {
                $sheet.SetPixel($frameX+$x,$y,$base.GetPixel($x,$y))
            }
        }

        # Hair, head, arms and torso rise by 0/1/2/1 pixels.
        for ($y=$top; $y -lt $waist; $y++) {
            for ($x=0; $x -lt 64; $x++) {
                $sheet.SetPixel($frameX+$x,$y-$offset,$base.GetPixel($x,$y))
            }
        }

        # Extend the waist edge into the temporary gap so no magenta seam appears.
        for ($gap=1; $gap -le $offset; $gap++) {
            $gapY=$waist-$gap
            for ($x=0; $x -lt 64; $x++) {
                $sheet.SetPixel($frameX+$x,$gapY,$base.GetPixel($x,$waist-1))
            }
        }
    }

    # Frame 2: duplicate the top forelock row one pixel lower to suggest inertia.
    for ($x=0; $x -lt 64; $x++) {
        $color=$base.GetPixel($x,$top)
        if ($color.ToArgb() -ne $magenta.ToArgb()) {
            $sheet.SetPixel(64+$x,$top,$color)
        }
    }

    # Frame 3: add one dark pixel above the highest forelock point.
    $forelockX=-1
    for ($x=0; $x -lt 64; $x++) {
        if ($base.GetPixel($x,$top).ToArgb() -ne $magenta.ToArgb()) { $forelockX=$x }
    }
    if ($forelockX -ge 0) {
        $sheet.SetPixel((2*64)+$forelockX,$top-3,$base.GetPixel($forelockX,$top))
    }

    Convert-ToPalette $sheet
    $sheet.Save($Output,[System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap=New-Object System.Drawing.Bitmap 2048,512,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics=[System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode=[System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.DrawImage($sheet,0,0,2048,512)
            } finally { $previewGraphics.Dispose() }
            $previewBitmap.Save($Preview,[System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $previewBitmap.Dispose() }
    }
} finally {
    $sheet.Dispose(); $base.Dispose(); $logical.Dispose(); $sourceBitmap.Dispose()
}
