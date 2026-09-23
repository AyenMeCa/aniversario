param(
    [Parameter(Mandatory = $true)]
    [string]$Output,

    [string]$Preview,

    [switch]$SpanishTextOnly
)

Add-Type -AssemblyName System.Drawing

$width = if ($SpanishTextOnly) { 640 } else { 512 }
$height = if ($SpanishTextOnly) { 216 } else { 496 }
$magenta = [System.Drawing.ColorTranslator]::FromHtml('#FF00FF')
$outline = [System.Drawing.ColorTranslator]::FromHtml('#4A2518')
$cream = [System.Drawing.ColorTranslator]::FromHtml('#FFF0C2')
$orange = @{
    Outline = $outline
    Base = [System.Drawing.ColorTranslator]::FromHtml('#ED7616')
    Light = [System.Drawing.ColorTranslator]::FromHtml('#FFB52E')
    Shadow = [System.Drawing.ColorTranslator]::FromHtml('#B94B11')
    Icon = $cream
}
$green = @{
    Outline = [System.Drawing.ColorTranslator]::FromHtml('#17351B')
    Base = [System.Drawing.ColorTranslator]::FromHtml('#36A83F')
    Light = [System.Drawing.ColorTranslator]::FromHtml('#72D956')
    Shadow = [System.Drawing.ColorTranslator]::FromHtml('#18702A')
    Icon = $cream
}

$canvas = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

function Fill-Rect([int]$x, [int]$y, [int]$w, [int]$h, [System.Drawing.Color]$color) {
    if ($w -le 0 -or $h -le 0) { return }
    $brush = New-Object System.Drawing.SolidBrush $color
    try { $graphics.FillRectangle($brush, $x, $y, $w, $h) }
    finally { $brush.Dispose() }
}

function Fill-Poly([array]$coords, [System.Drawing.Color]$color, [int]$offsetX = 0, [int]$offsetY = 0) {
    $points = New-Object 'System.Collections.Generic.List[System.Drawing.Point]'
    foreach ($coord in $coords) {
        $points.Add((New-Object System.Drawing.Point ([int]$coord[0] + $offsetX), ([int]$coord[1] + $offsetY)))
    }
    $brush = New-Object System.Drawing.SolidBrush $color
    try { $graphics.FillPolygon($brush, $points.ToArray()) }
    finally { $brush.Dispose() }
}

function Draw-Coin([int]$x, [int]$y, [bool]$pressed, [hashtable]$scheme) {
    $dy = if ($pressed) { 2 } else { 0 }
    $fill = if ($pressed) { $scheme.Shadow } else { $scheme.Base }
    $segments = @(
        @(0,2,10,12), @(2,2,6,20), @(4,2,4,24), @(6,17,2,28),
        @(23,2,4,24), @(25,2,6,20), @(27,2,10,12)
    )
    foreach ($s in $segments) { Fill-Rect ($x+$s[2]) ($y+$dy+$s[0]) $s[3] $s[1] $scheme.Outline }
    $inner = @(
        @(2,2,10,12), @(4,2,7,18), @(6,17,4,24), @(23,2,6,20), @(25,2,10,12)
    )
    foreach ($s in $inner) { Fill-Rect ($x+$s[2]) ($y+$dy+$s[0]) $s[3] $s[1] $fill }
    if (-not $pressed) {
        Fill-Rect ($x+10) ($y+2) 12 2 $scheme.Light
        Fill-Rect ($x+7) ($y+4) 18 2 $scheme.Light
        Fill-Rect ($x+4) ($y+6) 24 2 $scheme.Light
    }
    Fill-Rect ($x+4) ($y+$dy+21) 24 2 $scheme.Shadow
    Fill-Rect ($x+6) ($y+$dy+23) 20 2 $scheme.Shadow
    Fill-Rect ($x+10) ($y+$dy+25) 12 2 $scheme.Shadow
}

function Draw-DiamondButton([int]$x, [int]$y, [bool]$pressed, [hashtable]$scheme) {
    $dy = if ($pressed) { 2 } else { 0 }
    $fill = if ($pressed) { $scheme.Shadow } else { $scheme.Base }
    $outer = @(
        @(1,2,14,4), @(3,3,11,10), @(6,3,8,16), @(9,12,4,24),
        @(21,3,8,16), @(24,3,11,10), @(27,2,14,4)
    )
    foreach ($s in $outer) { Fill-Rect ($x+$s[2]) ($y+$dy+$s[0]) $s[3] $s[1] $scheme.Outline }
    $inner = @(
        @(4,2,14,4), @(6,3,11,10), @(9,12,6,20), @(21,3,11,10), @(24,2,14,4)
    )
    foreach ($s in $inner) { Fill-Rect ($x+$s[2]) ($y+$dy+$s[0]) $s[3] $s[1] $fill }
    if (-not $pressed) {
        Fill-Rect ($x+14) ($y+4) 4 2 $scheme.Light
        Fill-Rect ($x+11) ($y+6) 10 2 $scheme.Light
        Fill-Rect ($x+8) ($y+9) 16 2 $scheme.Light
    }
    Fill-Rect ($x+11) ($y+$dy+24) 10 2 $scheme.Shadow
}

function Draw-Icon([string]$name, [int]$x, [int]$y, [bool]$pressed, [hashtable]$scheme) {
    $dy = if ($pressed) { 2 } else { 0 }
    $c = $scheme.Icon
    switch ($name) {
        'power' {
            Fill-Rect ($x+15) ($y+$dy+8) 3 10 $c
            Fill-Rect ($x+10) ($y+$dy+12) 3 9 $c; Fill-Rect ($x+20) ($y+$dy+12) 3 9 $c
            Fill-Rect ($x+12) ($y+$dy+20) 9 3 $c
        }
        'volume' {
            Fill-Poly @(@(8,14),@(12,14),@(17,10),@(17,22),@(12,18),@(8,18)) $c $x ($y+$dy)
            Fill-Rect ($x+20) ($y+$dy+12) 2 9 $c; Fill-Rect ($x+23) ($y+$dy+10) 2 13 $c
        }
        'mute' {
            Fill-Poly @(@(6,14),@(10,14),@(15,10),@(15,22),@(10,18),@(6,18)) $c $x ($y+$dy)
            for ($i=0; $i -lt 8; $i++) { Fill-Rect ($x+19+$i) ($y+$dy+11+$i) 2 2 $c; Fill-Rect ($x+26-$i) ($y+$dy+11+$i) 2 2 $c }
        }
        'forward' {
            Fill-Poly @(@(7,10),@(7,22),@(14,16)) $c $x ($y+$dy)
            Fill-Poly @(@(15,10),@(15,22),@(23,16)) $c $x ($y+$dy)
        }
        'rewind' {
            Fill-Poly @(@(25,10),@(25,22),@(18,16)) $c $x ($y+$dy)
            Fill-Poly @(@(17,10),@(17,22),@(9,16)) $c $x ($y+$dy)
        }
        'info' { Fill-Rect ($x+15) ($y+$dy+13) 3 11 $c; Fill-Rect ($x+15) ($y+$dy+8) 3 3 $c }
        'restart' {
            Fill-Rect ($x+11) ($y+$dy+9) 11 2 $c; Fill-Rect ($x+9) ($y+$dy+11) 3 4 $c
            Fill-Rect ($x+8) ($y+$dy+8) 7 3 $c; Fill-Rect ($x+8) ($y+$dy+8) 3 7 $c
            Fill-Rect ($x+9) ($y+$dy+18) 3 4 $c; Fill-Rect ($x+11) ($y+$dy+22) 11 2 $c; Fill-Rect ($x+21) ($y+$dy+13) 3 9 $c
        }
        'close' {
            for ($i=0; $i -lt 9; $i++) { Fill-Rect ($x+11+$i) ($y+$dy+11+$i) 3 3 $c; Fill-Rect ($x+19-$i) ($y+$dy+11+$i) 3 3 $c }
        }
        'check' {
            Fill-Rect ($x+8) ($y+$dy+15) 3 4 $c; Fill-Rect ($x+11) ($y+$dy+18) 4 4 $c
            Fill-Rect ($x+14) ($y+$dy+16) 4 4 $c; Fill-Rect ($x+17) ($y+$dy+13) 4 4 $c; Fill-Rect ($x+20) ($y+$dy+10) 4 4 $c
        }
        'menu' { Fill-Rect ($x+8) ($y+$dy+9) 16 3 $c; Fill-Rect ($x+8) ($y+$dy+15) 16 3 $c; Fill-Rect ($x+8) ($y+$dy+21) 16 3 $c }
        'plus' { Fill-Rect ($x+14) ($y+$dy+8) 4 16 $c; Fill-Rect ($x+8) ($y+$dy+14) 16 4 $c }
        'minus' { Fill-Rect ($x+8) ($y+$dy+14) 16 4 $c }
        'gear' {
            Fill-Rect ($x+13) ($y+$dy+8) 6 16 $c; Fill-Rect ($x+8) ($y+$dy+13) 16 6 $c
            Fill-Rect ($x+10) ($y+$dy+10) 12 12 $c; Fill-Rect ($x+14) ($y+$dy+14) 4 4 $scheme.Base
        }
        'trophy' {
            Fill-Rect ($x+10) ($y+$dy+9) 12 3 $c; Fill-Rect ($x+12) ($y+$dy+12) 8 7 $c
            Fill-Rect ($x+8) ($y+$dy+11) 3 6 $c; Fill-Rect ($x+21) ($y+$dy+11) 3 6 $c
            Fill-Rect ($x+15) ($y+$dy+19) 3 4 $c; Fill-Rect ($x+11) ($y+$dy+23) 11 3 $c
        }
        'history' {
            Fill-Rect ($x+11) ($y+$dy+9) 11 2 $c; Fill-Rect ($x+9) ($y+$dy+11) 3 11 $c
            Fill-Rect ($x+11) ($y+$dy+22) 11 2 $c; Fill-Rect ($x+21) ($y+$dy+11) 3 11 $c
            Fill-Rect ($x+15) ($y+$dy+12) 3 7 $c; Fill-Rect ($x+17) ($y+$dy+17) 5 3 $c
            Fill-Rect ($x+7) ($y+$dy+8) 7 3 $c; Fill-Rect ($x+7) ($y+$dy+8) 3 7 $c
        }
        'heart' {
            Fill-Rect ($x+8) ($y+$dy+11) 6 6 $c; Fill-Rect ($x+18) ($y+$dy+11) 6 6 $c
            Fill-Rect ($x+6) ($y+$dy+14) 20 5 $c; Fill-Rect ($x+9) ($y+$dy+19) 14 3 $c
            Fill-Rect ($x+12) ($y+$dy+22) 8 3 $c; Fill-Rect ($x+15) ($y+$dy+25) 2 2 $c
        }
        'pause' { Fill-Rect ($x+9) ($y+$dy+9) 5 15 $c; Fill-Rect ($x+18) ($y+$dy+9) 5 15 $c }
        'left' { Fill-Poly @(@(8,16),@(18,8),@(18,13),@(24,13),@(24,19),@(18,19),@(18,24)) $c $x ($y+$dy) }
        'right' { Fill-Poly @(@(24,16),@(14,8),@(14,13),@(8,13),@(8,19),@(14,19),@(14,24)) $c $x ($y+$dy) }
        'up' { Fill-Poly @(@(16,7),@(8,17),@(13,17),@(13,24),@(19,24),@(19,17),@(24,17)) $c $x ($y+$dy) }
        'down' { Fill-Poly @(@(16,25),@(8,15),@(13,15),@(13,8),@(19,8),@(19,15),@(24,15)) $c $x ($y+$dy) }
        'home' {
            Fill-Poly @(@(7,15),@(16,7),@(25,15)) $c $x ($y+$dy)
            Fill-Rect ($x+10) ($y+$dy+14) 12 10 $c; Fill-Rect ($x+15) ($y+$dy+18) 4 6 $scheme.Base
        }
    }
}

function Draw-LooseArrow([string]$direction, [int]$x, [int]$y, [bool]$pressed) {
    $dy = if ($pressed) { 2 } else { 0 }
    $fill = if ($pressed) { $orange.Shadow } else { $orange.Base }
    switch ($direction) {
        'up' {
            $outer=@(@(16,1),@(30,16),@(23,16),@(23,29),@(9,29),@(9,16),@(2,16))
            $inner=@(@(16,5),@(25,14),@(20,14),@(20,26),@(12,26),@(12,14),@(7,14))
        }
        'down' {
            $outer=@(@(16,28),@(30,15),@(23,15),@(23,2),@(9,2),@(9,15),@(2,15))
            $inner=@(@(16,26),@(25,17),@(20,17),@(20,5),@(12,5),@(12,17),@(7,17))
        }
        'left' {
            $outer=@(@(1,16),@(16,2),@(16,9),@(29,9),@(29,23),@(16,23),@(16,28))
            $inner=@(@(5,16),@(14,7),@(14,12),@(26,12),@(26,20),@(14,20),@(14,25))
        }
        'right' {
            $outer=@(@(30,16),@(15,2),@(15,9),@(2,9),@(2,23),@(15,23),@(15,28))
            $inner=@(@(26,16),@(17,7),@(17,12),@(5,12),@(5,20),@(17,20),@(17,25))
        }
    }
    Fill-Poly $outer $orange.Outline $x ($y+$dy)
    Fill-Poly $inner $fill $x ($y+$dy)
    if (-not $pressed) { Fill-Rect ($x+11) ($y+$dy+6) 7 2 $orange.Light }
}

function Draw-DPad([int]$x, [int]$y, [bool]$pressed) {
    Draw-DiamondButton ($x+32) $y $pressed $orange; Draw-Icon 'home' ($x+32) $y $pressed $orange
    Draw-DiamondButton ($x+32) ($y+64) $pressed $orange; Draw-Icon 'heart' ($x+32) ($y+64) $pressed $orange
    Draw-DiamondButton $x ($y+32) $pressed $orange; Draw-Icon 'left' $x ($y+32) $pressed $orange
    Draw-DiamondButton ($x+64) ($y+32) $pressed $orange; Draw-Icon 'right' ($x+64) ($y+32) $pressed $orange
    Draw-Coin ($x+32) ($y+32) $pressed $orange; Draw-Icon 'gear' ($x+32) ($y+32) $pressed $orange
}

$glyphs = @{
    'A'=@('01110','10001','10001','11111','10001','10001','10001')
    'B'=@('11110','10001','10001','11110','10001','10001','11110')
    'C'=@('01111','10000','10000','10000','10000','10000','01111')
    'D'=@('11110','10001','10001','10001','10001','10001','11110')
    'E'=@('11111','10000','10000','11110','10000','10000','11111')
    'G'=@('01110','10001','10000','10111','10001','10001','01110')
    'I'=@('11111','00100','00100','00100','00100','00100','11111')
    'Í'=@('00100','11111','00100','00100','00100','00100','11111')
    'J'=@('00111','00010','00010','00010','10010','10010','01100')
    'L'=@('10000','10000','10000','10000','10000','10000','11111')
    'M'=@('10001','11011','10101','10101','10001','10001','10001')
    'N'=@('10001','11001','10101','10011','10001','10001','10001')
    'O'=@('01110','10001','10001','10001','10001','10001','01110')
    'P'=@('11110','10001','10001','11110','10000','10000','10000')
    'Q'=@('01110','10001','10001','10001','10101','10010','01101')
    'R'=@('11110','10001','10001','11110','10100','10010','10001')
    'S'=@('01111','10000','10000','01110','00001','00001','11110')
    'T'=@('11111','00100','00100','00100','00100','00100','00100')
    'U'=@('10001','10001','10001','10001','10001','10001','01110')
    'Ú'=@('00100','10001','10001','10001','10001','10001','01110')
    'V'=@('10001','10001','10001','10001','10001','01010','00100')
    'W'=@('10001','10001','10001','10101','10101','10101','01010')
    'Y'=@('10001','10001','01010','00100','00100','00100','00100')
    'Z'=@('11111','00001','00010','00100','01000','10000','11111')
    ' '=@('00000','00000','00000','00000','00000','00000','00000')
}
$glyphs[[string][char]0x00CD] = @('00100','11111','00100','00100','00100','00100','11111')
$glyphs[[string][char]0x00DA] = @('00100','10001','10001','10001','10001','10001','01110')

function Draw-PixelText([string]$text, [int]$cellX, [int]$cellY, [int]$cellW, [int]$cellH, [int]$scale, [bool]$pressed, [hashtable]$scheme) {
    $text = $text.ToUpperInvariant()
    $textWidth = ($text.Length * 6 * $scale) - $scale
    $textHeight = 7 * $scale
    $startX = $cellX + [int][Math]::Floor(($cellW - $textWidth) / 2)
    $startY = $cellY + [int][Math]::Floor(($cellH - $textHeight) / 2) + $(if ($pressed) { 2 } else { 0 })

    foreach ($shadowPass in @($true, $false)) {
        $color = if ($shadowPass) { $scheme.Shadow } else { $scheme.Icon }
        $offset = if ($shadowPass) { 1 } else { 0 }
        for ($index=0; $index -lt $text.Length; $index++) {
            $pattern = $glyphs[$text[$index].ToString()]
            if ($null -eq $pattern) {
                throw "Missing pixel-font glyph '$($text[$index])' (U+$([int][char]$text[$index]).ToString('X4')) in '$text'."
            }
            for ($row=0; $row -lt 7; $row++) {
                for ($col=0; $col -lt 5; $col++) {
                    if ($pattern[$row][$col] -eq '1') {
                        Fill-Rect ($startX + ($index*6*$scale) + ($col*$scale) + $offset) ($startY + ($row*$scale) + $offset) $scale $scale $color
                    }
                }
            }
        }
    }
}

function Draw-Capsule([string]$text, [int]$x, [int]$y, [bool]$pressed, [int]$cellWidth = 112) {
    $dy = if ($pressed) { 2 } else { 0 }
    $fill = if ($pressed) { $green.Shadow } else { $green.Base }
    $outer = @(@(0,2,10,($cellWidth-20)),@(2,2,6,($cellWidth-12)),@(4,21,2,($cellWidth-4)),@(25,2,6,($cellWidth-12)),@(27,2,10,($cellWidth-20)))
    foreach($s in $outer){ Fill-Rect ($x+$s[2]) ($y+$dy+$s[0]) $s[3] $s[1] $green.Outline }
    $inner = @(@(2,2,10,($cellWidth-20)),@(4,2,6,($cellWidth-12)),@(6,17,4,($cellWidth-8)),@(23,2,6,($cellWidth-12)),@(25,2,10,($cellWidth-20)))
    foreach($s in $inner){ Fill-Rect ($x+$s[2]) ($y+$dy+$s[0]) $s[3] $s[1] $fill }
    if(-not $pressed){ Fill-Rect ($x+10) ($y+2) ($cellWidth-20) 2 $green.Light; Fill-Rect ($x+6) ($y+4) ($cellWidth-12) 2 $green.Light }
    Fill-Rect ($x+6) ($y+$dy+23) ($cellWidth-12) 2 $green.Shadow; Fill-Rect ($x+10) ($y+$dy+25) ($cellWidth-20) 2 $green.Shadow
    Draw-PixelText $text $x $y $cellWidth 32 2 $pressed $green
}

try {
    $graphics.Clear($magenta)

    if ($SpanishTextOnly) {
        $menuEs = 'MEN' + [char]0x00DA
        $siEs = 'S' + [char]0x00CD
        $labels = @('NUEVO JUEGO','TIENDA','INICIAR','AJUSTES',$menuEs,'ACERCA','SALIR','JUGAR')
        for ($i=0; $i -lt $labels.Count; $i++) {
            $col=$i%2; $row=[Math]::Floor($i/2)
            $pairX=24+($col*304); $cellY=8+($row*40)
            Draw-Capsule $labels[$i] $pairX $cellY $false 144
            Draw-Capsule $labels[$i] ($pairX+144) $cellY $true 144
        }

        $smallButtons = @(@($siEs,248),@('NO',328))
        foreach ($button in $smallButtons) {
            $label=[string]$button[0]; $pairX=[int]$button[1]; $cellY=176
            Draw-Coin $pairX $cellY $false $green; Draw-PixelText $label $pairX $cellY 32 32 1 $false $green
            Draw-Coin ($pairX+32) $cellY $true $green; Draw-PixelText $label ($pairX+32) $cellY 32 32 1 $true $green
        }
    } else {
        $coinNames = @('power','volume','mute','forward','rewind','info','restart','close','check','menu','plus','minus','gear','trophy','history','heart','pause')
        for ($i=0; $i -lt $coinNames.Count; $i++) {
            $col = $i % 5; $row = [Math]::Floor($i / 5)
            $pairX = 80 + ($col * 72); $cellY = 8 + ($row * 40)
            Draw-Coin $pairX $cellY $false $orange; Draw-Icon $coinNames[$i] $pairX $cellY $false $orange
            Draw-Coin ($pairX+32) $cellY $true $orange; Draw-Icon $coinNames[$i] ($pairX+32) $cellY $true $orange
        }

        Draw-DPad 80 176 $false
        Draw-DPad 176 176 $true

        $directions = @('up','down','left','right')
        for ($i=0; $i -lt 4; $i++) {
            $col=$i%2; $row=[Math]::Floor($i/2)
            $pairX=312+($col*72); $cellY=184+($row*40)
            Draw-LooseArrow $directions[$i] $pairX $cellY $false
            Draw-LooseArrow $directions[$i] ($pairX+32) $cellY $true
        }

        $labels = @('NEW GAME','STORE','START','SETTINGS','MENU','ABOUT','QUIT','PLAY')
        for ($i=0; $i -lt $labels.Count; $i++) {
            $col=$i%2; $row=[Math]::Floor($i/2)
            $pairX=28+($col*232); $cellY=288+($row*40)
            Draw-Capsule $labels[$i] $pairX $cellY $false
            Draw-Capsule $labels[$i] ($pairX+112) $cellY $true
        }

        $smallButtons = @(@('YES',184),@('NO',264))
        foreach ($button in $smallButtons) {
            $label=[string]$button[0]; $pairX=[int]$button[1]; $cellY=456
            Draw-Coin $pairX $cellY $false $green; Draw-PixelText $label $pairX $cellY 32 32 1 $false $green
            Draw-Coin ($pairX+32) $cellY $true $green; Draw-PixelText $label ($pairX+32) $cellY 32 32 1 $true $green
        }
    }

    $outputDirectory = Split-Path -Parent $Output
    if ($outputDirectory) { [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null }
    $canvas.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($Preview) {
        $previewBitmap = New-Object System.Drawing.Bitmap ($width*2), ($height*2), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $previewGraphics = [System.Drawing.Graphics]::FromImage($previewBitmap)
            try {
                $previewGraphics.CompositingMode=[System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                $previewGraphics.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::None
                $previewGraphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $previewGraphics.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $previewGraphics.DrawImage($canvas,0,0,$width*2,$height*2)
            } finally { $previewGraphics.Dispose() }
            $previewBitmap.Save($Preview,[System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $previewBitmap.Dispose() }
    }
} finally {
    $graphics.Dispose(); $canvas.Dispose()
}
