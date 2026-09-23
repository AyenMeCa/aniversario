param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

$paletteHex = @(
    '#071126', '#0A1B38', '#0F2C57', '#14457A', '#1B6190',
    '#23819B', '#35A4A3', '#102B4A', '#D7F4F0', '#73C9DA',
    '#F4D35E', '#D99D37'
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
$final = New-Object System.Drawing.Bitmap 352, 256, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    # Preserve the requested 11:8 ratio with a one-row crop from the generated source.
    $sourceHeight = [Math]::Min($sourceBitmap.Height, [int][Math]::Floor($sourceBitmap.Width * 8 / 11))
    $sourceY = [int][Math]::Floor(($sourceBitmap.Height - $sourceHeight) / 2)

    $graphics = [System.Drawing.Graphics]::FromImage($final)
    try {
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.DrawImage(
            $sourceBitmap,
            (New-Object System.Drawing.Rectangle 0, 0, 352, 256),
            (New-Object System.Drawing.Rectangle 0, $sourceY, $sourceBitmap.Width, $sourceHeight),
            [System.Drawing.GraphicsUnit]::Pixel
        )
    } finally { $graphics.Dispose() }

    # Collapse all residual source shades into a compact, hard-edged game palette.
    for ($y=0; $y -lt $final.Height; $y++) {
        for ($x=0; $x -lt $final.Width; $x++) {
            $final.SetPixel($x, $y, (Get-NearestColor $final.GetPixel($x, $y)))
        }
    }

    # Rebuild the open sky as a fine ordered-dither gradient. Bright star pixels
    # remain untouched, while the broad source bands disappear.
    $gradientStops = @(
        @(0,   $palette[0]),
        @(34,  $palette[1]),
        @(70,  $palette[2]),
        @(106, $palette[3]),
        @(142, $palette[4]),
        @(170, $palette[5]),
        @(195, $palette[6])
    )
    $bayer = @(
        @(0,8,2,10),
        @(12,4,14,6),
        @(3,11,1,9),
        @(15,7,13,5)
    )
    $starColors = New-Object 'System.Collections.Generic.HashSet[int]'
    foreach ($index in @(8,9,10,11)) { [void]$starColors.Add($palette[$index].ToArgb()) }

    for ($y=0; $y -lt 195; $y++) {
        $lowStop = $gradientStops[0]
        $highStop = $gradientStops[1]
        for ($index=0; $index -lt ($gradientStops.Count-1); $index++) {
            if ($y -ge $gradientStops[$index][0] -and $y -le $gradientStops[$index+1][0]) {
                $lowStop = $gradientStops[$index]
                $highStop = $gradientStops[$index+1]
                break
            }
        }
        $span = [double]($highStop[0] - $lowStop[0])
        $fraction = if ($span -gt 0) { ($y - $lowStop[0]) / $span } else { 0 }
        for ($x=0; $x -lt $final.Width; $x++) {
            $current = $final.GetPixel($x, $y)
            if ($starColors.Contains($current.ToArgb())) { continue }
            $threshold = ($bayer[$y % 4][$x % 4] + 0.5) / 16.0
            $replacement = if ($fraction -gt $threshold) { $highStop[1] } else { $lowStop[1] }
            $final.SetPixel($x, $y, $replacement)
        }
    }

    # Keep the central title-safe area free of the middle shooting star.
    # Two shooting stars remain, one on each outer side of the upper sky.
    for ($y=39; $y -le 62; $y++) {
        $lowStop = $gradientStops[0]
        $highStop = $gradientStops[1]
        for ($index=0; $index -lt ($gradientStops.Count-1); $index++) {
            if ($y -ge $gradientStops[$index][0] -and $y -le $gradientStops[$index+1][0]) {
                $lowStop = $gradientStops[$index]
                $highStop = $gradientStops[$index+1]
                break
            }
        }
        $span = [double]($highStop[0] - $lowStop[0])
        $fraction = if ($span -gt 0) { ($y - $lowStop[0]) / $span } else { 0 }
        for ($x=134; $x -le 162; $x++) {
            $threshold = ($bayer[$y % 4][$x % 4] + 0.5) / 16.0
            $replacement = if ($fraction -gt $threshold) { $highStop[1] } else { $lowStop[1] }
            $final.SetPixel($x, $y, $replacement)
        }
    }

    $outputDirectory = Split-Path -Parent $Output
    if ($outputDirectory) { [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null }
    $final.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap = New-Object System.Drawing.Bitmap 1408, 1024, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.DrawImage($final, 0, 0, 1408, 1024)
            } finally { $previewGraphics.Dispose() }
            $previewBitmap.Save($Preview, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $previewBitmap.Dispose() }
    }
} finally {
    $final.Dispose(); $sourceBitmap.Dispose()
}
