param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [Parameter(Mandatory = $true)]
    [string]$Preview
)

Add-Type -AssemblyName System.Drawing

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($Source)
if ($sourceBitmap.Width -ne 384 -or $sourceBitmap.Height -ne 128) {
    $sourceBitmap.Dispose()
    throw 'Expected a 384x128 spritesheet.'
}

$sheet = New-Object System.Drawing.Bitmap 384, 128, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    $graphics = [System.Drawing.Graphics]::FromImage($sheet)
    try {
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        for ($row = 0; $row -lt 2; $row++) {
            for ($column = 0; $column -lt 6; $column++) {
                $rectangle = New-Object System.Drawing.Rectangle ($column * 64), ($row * 64), 64, 64
                $cell = $sourceBitmap.Clone($rectangle, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
                try {
                    $cell.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX)
                    $graphics.DrawImageUnscaled($cell, $rectangle.X, $rectangle.Y)
                }
                finally {
                    $cell.Dispose()
                }
            }
        }
    }
    finally {
        $graphics.Dispose()
    }

    $outputDirectory = Split-Path -Parent $Output
    if ($outputDirectory) {
        [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
    }
    $sheet.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    $previewBitmap = New-Object System.Drawing.Bitmap 3072, 1024, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
        try {
            $previewGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $previewGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
            $previewGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
            $previewGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
            $previewGraphics.DrawImage(
                $sheet,
                (New-Object System.Drawing.Rectangle 0, 0, 3072, 1024),
                (New-Object System.Drawing.Rectangle 0, 0, 384, 128),
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
    $sourceBitmap.Dispose()
}
