param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [Parameter(Mandatory = $true)]
    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

# Related brow, dress-highlight and corset-lacing colors are merged into their
# nearest supplied neighbors to keep the complete sheet at 18 colors.
$palette = @(
    [System.Drawing.ColorTranslator]::FromHtml('#FF00FF'),
    [System.Drawing.ColorTranslator]::FromHtml('#4A2A1C'),
    [System.Drawing.ColorTranslator]::FromHtml('#F2B83A'),
    [System.Drawing.ColorTranslator]::FromHtml('#FBE38A'),
    [System.Drawing.ColorTranslator]::FromHtml('#D9822B'),
    [System.Drawing.ColorTranslator]::FromHtml('#A85A20'),
    [System.Drawing.ColorTranslator]::FromHtml('#F9D2AE'),
    [System.Drawing.ColorTranslator]::FromHtml('#E5A985'),
    [System.Drawing.ColorTranslator]::FromHtml('#F09A8E'),
    [System.Drawing.ColorTranslator]::FromHtml('#4F9A4A'),
    [System.Drawing.ColorTranslator]::FromHtml('#2E6B36'),
    [System.Drawing.ColorTranslator]::FromHtml('#1B1420'),
    [System.Drawing.ColorTranslator]::FromHtml('#FFFFFF'),
    [System.Drawing.ColorTranslator]::FromHtml('#D06A78'),
    [System.Drawing.ColorTranslator]::FromHtml('#6A1E2C'),
    [System.Drawing.ColorTranslator]::FromHtml('#B99AE0'),
    [System.Drawing.ColorTranslator]::FromHtml('#8E6CC0'),
    [System.Drawing.ColorTranslator]::FromHtml('#F4EBDD')
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
            Copy-Region $frames[$index] $registered 14 29 34 38
        }
        else {
            Copy-Region $frames[$index] $registered 7 19 40 29
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
