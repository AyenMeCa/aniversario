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
    [System.Drawing.ColorTranslator]::FromHtml('#A597DE')
)

$magenta = [System.Drawing.ColorTranslator]::FromHtml('#FF00FF')
$outline = [System.Drawing.ColorTranslator]::FromHtml('#26303D')

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

function New-MagentaFrame {
    $frame = New-Object System.Drawing.Bitmap 64, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($frame)
    try {
        $graphics.Clear($magenta)
    }
    finally {
        $graphics.Dispose()
    }
    return $frame
}

function Set-SafePixel(
    [System.Drawing.Bitmap]$bitmap,
    [int]$x,
    [int]$y,
    [System.Drawing.Color]$color
) {
    if ($x -ge 0 -and $x -lt 64 -and $y -ge 0 -and $y -lt 64) {
        $bitmap.SetPixel($x, $y, $color)
    }
}

function New-IdleFrame(
    [System.Drawing.Bitmap]$base,
    [int]$rise,
    [ValidateSet('lag', 'out', 'in')]
    [string]$earMotion,
    [bool]$armsOut
) {
    $frame = New-MagentaFrame

    # Lower legs and feet are copied without any movement.
    for ($y = 58; $y -lt 64; $y++) {
        for ($x = 0; $x -lt 64; $x++) {
            $color = $base.GetPixel($x, $y)
            if ($color.ToArgb() -ne $magenta.ToArgb()) {
                $frame.SetPixel($x, $y, $color)
            }
        }
    }

    for ($y = 0; $y -lt 58; $y++) {
        for ($x = 0; $x -lt 64; $x++) {
            $color = $base.GetPixel($x, $y)
            if ($color.ToArgb() -eq $magenta.ToArgb()) {
                continue
            }

            $deltaX = 0
            $deltaY = -$rise

            Set-SafePixel $frame ($x + $deltaX) ($y + $deltaY) $color
        }
    }

    # Keep enough seam rows fixed to cover the 1- or 2-pixel displacement.
    for ($seamY = 58 - $rise; $seamY -le 57; $seamY++) {
        for ($x = 0; $x -lt 64; $x++) {
            $color = $base.GetPixel($x, $seamY)
            if ($color.ToArgb() -ne $magenta.ToArgb()) {
                $frame.SetPixel($x, $seamY, $color)
            }
        }
    }

    return $frame
}

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
$frames = @()

try {
    # Generated sheets can be a few pixels short of an exact four-way split.
    # The first proportional quarter is sufficient because all motion is rebuilt below.
    $sourceFrameWidth = [int][Math]::Round($sourceBitmap.Width / 4.0)
    $sample = New-Object System.Drawing.Bitmap 48, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($sample)
        try {
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
            $graphics.DrawImage(
                $sourceBitmap,
                (New-Object System.Drawing.Rectangle 0, 0, 48, 64),
                (New-Object System.Drawing.Rectangle 0, 0, $sourceFrameWidth, $sourceBitmap.Height),
                [System.Drawing.GraphicsUnit]::Pixel
            )
        }
        finally {
            $graphics.Dispose()
        }

        for ($y = 0; $y -lt 64; $y++) {
            for ($x = 0; $x -lt 48; $x++) {
                $sample.SetPixel($x, $y, (Get-NearestPaletteColor $sample.GetPixel($x, $y)))
            }
        }

        $minX = 48
        $minY = 64
        $maxX = -1
        $maxY = -1
        for ($y = 0; $y -lt 64; $y++) {
            for ($x = 0; $x -lt 48; $x++) {
                if ($sample.GetPixel($x, $y).ToArgb() -ne $magenta.ToArgb()) {
                    $minX = [Math]::Min($minX, $x)
                    $minY = [Math]::Min($minY, $y)
                    $maxX = [Math]::Max($maxX, $x)
                    $maxY = [Math]::Max($maxY, $y)
                }
            }
        }

        if ($maxX -lt $minX -or $maxY -lt $minY) {
            throw 'No character pixels were detected in source frame 1.'
        }

        $base = New-MagentaFrame
        try {
            $baseGraphics = [System.Drawing.Graphics]::FromImage($base)
            try {
                $baseGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $baseGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $baseGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $baseGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $baseGraphics.DrawImage(
                    $sample,
                    (New-Object System.Drawing.Rectangle 18, 31, 28, 32),
                    (New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)),
                    [System.Drawing.GraphicsUnit]::Pixel
                )
            }
            finally {
                $baseGraphics.Dispose()
            }

            # Replace the downsampled mouth blob with a small readable closed smile.
            $bodyBase = [System.Drawing.ColorTranslator]::FromHtml('#A4E1F9')
            for ($mouthY = 47; $mouthY -le 50; $mouthY++) {
                for ($mouthX = 29; $mouthX -le 34; $mouthX++) {
                    $base.SetPixel($mouthX, $mouthY, $bodyBase)
                }
            }
            foreach ($point in @(@(30, 48), @(31, 49), @(32, 49), @(33, 48))) {
                $base.SetPixel($point[0], $point[1], $outline)
            }

            $frames += $base.Clone()
            $frames += New-IdleFrame $base 1 'lag' $true
            $topFrame = New-IdleFrame $base 2 'out' $true
            for ($mouthY = 46; $mouthY -le 48; $mouthY++) {
                for ($mouthX = 28; $mouthX -le 35; $mouthX++) {
                    $topFrame.SetPixel($mouthX, $mouthY, $bodyBase)
                }
            }
            foreach ($point in @(
                @(29, 46), @(30, 47), @(31, 48),
                @(32, 48), @(33, 47), @(34, 46)
            )) {
                $topFrame.SetPixel($point[0], $point[1], $outline)
            }
            $topFrame.SetPixel(17, 32, $outline)
            $topFrame.SetPixel(46, 32, $outline)
            $frames += $topFrame
            $frames += New-IdleFrame $base 1 'in' $false
        }
        finally {
            $base.Dispose()
        }
    }
    finally {
        $sample.Dispose()
    }

    $sheet = New-Object System.Drawing.Bitmap 256, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
        try {
            $sheetGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            for ($index = 0; $index -lt 4; $index++) {
                $sheetGraphics.DrawImageUnscaled($frames[$index], $index * 64, 0)
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

        $previewBitmap = New-Object System.Drawing.Bitmap 2048, 512, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.DrawImage(
                    $sheet,
                    (New-Object System.Drawing.Rectangle 0, 0, 2048, 512),
                    (New-Object System.Drawing.Rectangle 0, 0, 256, 64),
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
