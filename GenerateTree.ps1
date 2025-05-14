function Get-Tree {
    param (
        [string]$Path = ".",
        [int]$Depth = 999,
        [string]$Output = ""
    )
    $currentDepth = 0
    function Recurse {
        param ($path, $depth)
        if ($depth -gt $currentDepth) {
            $items = Get-ChildItem $path
            foreach ($item in $items) {
                if ($item.PSIsContainer) {
                    "$("|   " * $currentDepth)├── $($item.Name)"
                    $currentDepth++
                    Recurse $item.FullName $Depth
                    $currentDepth--
                } else {
                    "$("|   " * $currentDepth)├── $($item.Name)"
                }
            }
        }
    }
    if (![string]::IsNullOrEmpty($Output)) {
        Recurse $Path $Depth | Out-File -FilePath $Output -Encoding utf8
    } else {
        Recurse $Path $Depth
    }
}
Get-Tree -Path "./" -Depth 2 -Output "tree.txt"
