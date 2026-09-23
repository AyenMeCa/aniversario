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
    [System.Drawing.ColorTranslator]::FromHtml('#3B0F1F'),
    [System.Drawing.ColorTranslator]::FromHtml('#F0506E'),
    [System.Drawing.ColorTranslator]::FromHtml('#D23A5B'),
    [System.Drawing.ColorTranslator]::FromHtml('#9C253D'),
    [System.Drawing.ColorTranslator]::FromHtml('#771D30'),
    [System.Drawing.ColorTranslator]::FromHtml('#49374A'),
    [System.Drawing.ColorTranslator]::FromHtml('#2A2030'),
    [System.Drawing.ColorTranslator]::FromHtml('#FFFFFF'),
    [System.Drawing.ColorTranslator]::FromHtml('#C98CAD'),
    [System.Drawing.ColorTranslator]::FromHtml('#2E3B8F'),
    [System.Drawing.ColorTranslator]::FromHtml('#0F0A1E'),
    [System.Drawing.ColorTranslator]::FromHtml('#B5476B')
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

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$frames = @()

try {
    if (($sourceBitmap.Width % 4) -ne 0) {
        throw 'Source width must divide evenly into four frames.'
    }

    $sourceFrameWidth = [int]($sourceBitmap.Width / 4)
    $cropTop = [int](($sourceBitmap.Height - $sourceFrameWidth) * 0.35)
    $cropHeight = $sourceBitmap.Height - $cropTop

    for ($index = 0; $index -lt 4; $index++) {
        $frame = New-Object System.Drawing.Bitmap 32, 32, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [System.Drawing.Graphics]::FromImage($frame)
        try {
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
            $graphics.DrawImage(
                $sourceBitmap,
                (New-Object System.Drawing.Rectangle 0, 0, 32, 32),
                (New-Object System.Drawing.Rectangle ($index * $sourceFrameWidth), $cropTop, $sourceFrameWidth, $cropHeight),
                [System.Drawing.GraphicsUnit]::Pixel
            )
        }
        finally {
            $graphics.Dispose()
        }

        for ($y = 0; $y -lt 32; $y++) {
            for ($x = 0; $x -lt 32; $x++) {
                $frame.SetPixel($x, $y, (Get-NearestPaletteColor $frame.GetPixel($x, $y)))
            }
        }

        $frames += $frame
    }

    # Frame 1 is the registration master. Only expression pixels are imported.
    for ($index = 1; $index -lt 4; $index++) {
        $registered = $frames[0].Clone()
        if ($index -eq 1 -or $index -eq 2) {
            Copy-Region $frames[$index] $registered 13 18 22 23
        }
        else {
            Copy-Region $frames[$index] $registered 4 11 27 18
        }
        $frames[$index].Dispose()
        $frames[$index] = $registered
    }

    $sheet = New-Object System.Drawing.Bitmap 128, 32, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
        try {
            $sheetGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            for ($index = 0; $index -lt 4; $index++) {
                $sheetGraphics.DrawImageUnscaled($frames[$index], $index * 32, 0)
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

        $previewBitmap = New-Object System.Drawing.Bitmap 1024, 256, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.DrawImage(
                    $sheet,
                    (New-Object System.Drawing.Rectangle 0, 0, 1024, 256),
                    (New-Object System.Drawing.Rectangle 0, 0, 128, 32),
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
