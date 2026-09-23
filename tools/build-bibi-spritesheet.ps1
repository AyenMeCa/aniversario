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
    [System.Drawing.ColorTranslator]::FromHtml('#140E1E'),
    [System.Drawing.ColorTranslator]::FromHtml('#1E2A66'),
    [System.Drawing.ColorTranslator]::FromHtml('#141B47'),
    [System.Drawing.ColorTranslator]::FromHtml('#4661B8'),
    [System.Drawing.ColorTranslator]::FromHtml('#F9CFA3'),
    [System.Drawing.ColorTranslator]::FromHtml('#E6A883'),
    [System.Drawing.ColorTranslator]::FromHtml('#F4877F'),
    [System.Drawing.ColorTranslator]::FromHtml('#FFFFFF'),
    [System.Drawing.ColorTranslator]::FromHtml('#5A1A2B'),
    [System.Drawing.ColorTranslator]::FromHtml('#D5636F'),
    [System.Drawing.ColorTranslator]::FromHtml('#66208C'),
    [System.Drawing.ColorTranslator]::FromHtml('#43146A'),
    [System.Drawing.ColorTranslator]::FromHtml('#9B4CC4'),
    [System.Drawing.ColorTranslator]::FromHtml('#B9C8F5'),
    [System.Drawing.ColorTranslator]::FromHtml('#F0AADB'),
    [System.Drawing.ColorTranslator]::FromHtml('#F05AAE')
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

    for ($index = 0; $index -lt 4; $index++) {
        $frame = New-Object System.Drawing.Bitmap 48, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [System.Drawing.Graphics]::FromImage($frame)
        try {
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
            $graphics.DrawImage(
                $sourceBitmap,
                (New-Object System.Drawing.Rectangle 0, 0, 48, 64),
                (New-Object System.Drawing.Rectangle ($index * $sourceFrameWidth), 0, $sourceFrameWidth, $sourceBitmap.Height),
                [System.Drawing.GraphicsUnit]::Pixel
            )
        }
        finally {
            $graphics.Dispose()
        }

        for ($y = 0; $y -lt 64; $y++) {
            for ($x = 0; $x -lt 48; $x++) {
                $frame.SetPixel($x, $y, (Get-NearestPaletteColor $frame.GetPixel($x, $y)))
            }
        }

        $frames += $frame
    }

    # Frame 1 is the registration master. Import only animated features.
    for ($index = 1; $index -lt 4; $index++) {
        $registered = $frames[0].Clone()
        if ($index -eq 1 -or $index -eq 2) {
            Copy-Region $frames[$index] $registered 19 38 35 47
        }
        else {
            Copy-Region $frames[$index] $registered 9 31 39 38
        }
        $frames[$index].Dispose()
        $frames[$index] = $registered
    }

    # Restore the characteristic two-point catchlight inside each dark pupil.
    $white = [System.Drawing.ColorTranslator]::FromHtml('#FFFFFF')
    for ($index = 0; $index -lt 3; $index++) {
        foreach ($point in @(
            @(21, 33), @(21, 34), @(23, 37),
            @(32, 33), @(32, 34), @(34, 37)
        )) {
            $frames[$index].SetPixel($point[0], $point[1], $white)
        }
    }

    $sheet = New-Object System.Drawing.Bitmap 192, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
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

        $previewBitmap = New-Object System.Drawing.Bitmap 1536, 512, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.DrawImage(
                    $sheet,
                    (New-Object System.Drawing.Rectangle 0, 0, 1536, 512),
                    (New-Object System.Drawing.Rectangle 0, 0, 192, 64),
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
