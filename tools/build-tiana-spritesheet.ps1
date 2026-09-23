param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [Parameter(Mandatory = $true)]
    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

# The near-identical tiara/dress greens share one entry to keep the complete
# sheet at 18 colors including the chroma-key background.
$palette = @(
    [System.Drawing.ColorTranslator]::FromHtml('#FF00FF'),
    [System.Drawing.ColorTranslator]::FromHtml('#21141A'),
    [System.Drawing.ColorTranslator]::FromHtml('#4A3038'),
    [System.Drawing.ColorTranslator]::FromHtml('#A8643F'),
    [System.Drawing.ColorTranslator]::FromHtml('#84492F'),
    [System.Drawing.ColorTranslator]::FromHtml('#5E3324'),
    [System.Drawing.ColorTranslator]::FromHtml('#B6E39A'),
    [System.Drawing.ColorTranslator]::FromHtml('#78B87C'),
    [System.Drawing.ColorTranslator]::FromHtml('#4E8A62'),
    [System.Drawing.ColorTranslator]::FromHtml('#E5E4A2'),
    [System.Drawing.ColorTranslator]::FromHtml('#6E3722'),
    [System.Drawing.ColorTranslator]::FromHtml('#FFFFFF'),
    [System.Drawing.ColorTranslator]::FromHtml('#E45A97'),
    [System.Drawing.ColorTranslator]::FromHtml('#9A5A9A'),
    [System.Drawing.ColorTranslator]::FromHtml('#963148'),
    [System.Drawing.ColorTranslator]::FromHtml('#DE5477'),
    [System.Drawing.ColorTranslator]::FromHtml('#43151F'),
    [System.Drawing.ColorTranslator]::FromHtml('#D8EBC9')
)

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

function Copy-Region(
    [System.Drawing.Bitmap]$from,
    [System.Drawing.Bitmap]$to,
    [int]$left,
    [int]$top,
    [int]$right,
    [int]$bottom
) {
    for ($y = $top; $y -le $bottom; $y++) {
        for ($x = $left; $x -le $right; $x++) {
            $to.SetPixel($x, $y, $from.GetPixel($x, $y))
        }
    }
}

$magenta = [System.Drawing.ColorTranslator]::FromHtml('#FF00FF')
$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$frames = @()

try {
    if (($sourceBitmap.Width % 4) -ne 0) {
        throw 'Source width must divide evenly into four frames.'
    }

    $sourceFrameWidth = [int]($sourceBitmap.Width / 4)
    $cropHeight = [Math]::Min(680, $sourceBitmap.Height)
    $scaledWidth = [int][Math]::Round(48 * $sourceFrameWidth / $cropHeight)
    $offsetX = [int][Math]::Floor((48 - $scaledWidth) / 2)

    for ($index = 0; $index -lt 4; $index++) {
        $frame = New-Object System.Drawing.Bitmap 48, 48, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [System.Drawing.Graphics]::FromImage($frame)
        try {
            $graphics.Clear($magenta)
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
            $graphics.DrawImage(
                $sourceBitmap,
                (New-Object System.Drawing.Rectangle $offsetX, 0, $scaledWidth, 48),
                (New-Object System.Drawing.Rectangle ($index * $sourceFrameWidth), 0, $sourceFrameWidth, $cropHeight),
                [System.Drawing.GraphicsUnit]::Pixel
            )
        }
        finally {
            $graphics.Dispose()
        }

        for ($y = 0; $y -lt 48; $y++) {
            for ($x = 0; $x -lt 48; $x++) {
                $frame.SetPixel($x, $y, (Get-NearestPaletteColor $frame.GetPixel($x, $y)))
            }
        }

        $frames += $frame
    }

    # Register all frames to frame 1; import only the animated features.
    for ($index = 1; $index -lt 4; $index++) {
        $registered = $frames[0].Clone()
        if ($index -eq 1 -or $index -eq 2) {
            Copy-Region $frames[$index] $registered 14 30 33 37
        }
        else {
            Copy-Region $frames[$index] $registered 9 21 39 31
        }
        $frames[$index].Dispose()
        $frames[$index] = $registered
    }

    $sheet = New-Object System.Drawing.Bitmap 192, 48, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
        try {
            $sheetGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            for ($index = 0; $index -lt 4; $index++) {
                $sheetGraphics.DrawImageUnscaled($frames[$index], $index * 48, 0)
            }
        }
        finally {
            $sheetGraphics.Dispose()
        }

        $outputDirectory = Split-Path -Parent $Output
        if ($outputDirectory) {
            [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
        }
        $sheet.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

        $previewBitmap = New-Object System.Drawing.Bitmap 1536, 384, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.DrawImage(
                    $sheet,
                    (New-Object System.Drawing.Rectangle 0, 0, 1536, 384),
                    (New-Object System.Drawing.Rectangle 0, 0, 192, 48),
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
    }
}
finally {
    foreach ($frame in $frames) {
        $frame.Dispose()
    }
    $sourceBitmap.Dispose()
}
