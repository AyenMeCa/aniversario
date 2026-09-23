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
    [System.Drawing.ColorTranslator]::FromHtml('#26303D'),
    [System.Drawing.ColorTranslator]::FromHtml('#A4E1F9'),
    [System.Drawing.ColorTranslator]::FromHtml('#7CC6EA'),
    [System.Drawing.ColorTranslator]::FromHtml('#5AA6CC'),
    [System.Drawing.ColorTranslator]::FromHtml('#D2F1FC'),
    [System.Drawing.ColorTranslator]::FromHtml('#FFFFFF'),
    [System.Drawing.ColorTranslator]::FromHtml('#DCEAF2'),
    [System.Drawing.ColorTranslator]::FromHtml('#6C58B0'),
    [System.Drawing.ColorTranslator]::FromHtml('#4E3F8C'),
    [System.Drawing.ColorTranslator]::FromHtml('#A597DE'),
    [System.Drawing.ColorTranslator]::FromHtml('#3B2340'),
    [System.Drawing.ColorTranslator]::FromHtml('#F08AA4')
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

    # Frame 1 is the master. Eye lines never change; only speaking mouths do.
    for ($index = 1; $index -lt 4; $index++) {
        $registered = $frames[0].Clone()
        if ($index -eq 1 -or $index -eq 2) {
            Copy-Region $frames[$index] $registered 16 36 32 47
        }
        $frames[$index].Dispose()
        $frames[$index] = $registered
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
