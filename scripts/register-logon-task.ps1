#requires -Version 7.0

[Diagnostics.CodeAnalysis.SuppressMessageAttribute(
    'PSUseBOMForUnicodeEncodedFile',
    '',
    Justification = 'PowerShell 7 は UTF-8（BOM なし）の日本語スクリプトを標準で扱えるため。'
)]
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'Medium')]
param(
    [ValidateSet('Prompt', 'Window', 'Tray')]
    [string]$StartupMode = 'Prompt',

    [string]$ExecutablePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$TaskName = 'povo-promo-code-notify-logon'
$TaskPath = '\'
$TaskFingerprint = 'povo-promo-code-notify/logon-task/v1'
$ExecutableName = 'povo-promo-code-notify.exe'

function ConvertTo-NormalizedPath {
    param([AllowEmptyString()][string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return ''
    }

    $expandedPath = [Environment]::ExpandEnvironmentVariables($Path.Trim().Trim('"'))

    try {
        return [IO.Path]::GetFullPath($expandedPath).TrimEnd('\').ToUpperInvariant()
    }
    catch {
        return $expandedPath.TrimEnd('\').ToUpperInvariant()
    }
}

function Resolve-AppExecutable {
    param([AllowEmptyString()][string]$RequestedPath)

    $candidatePaths = [Collections.Generic.List[string]]::new()

    if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
        $candidatePaths.Add($RequestedPath)
    }

    $candidatePaths.Add((Join-Path $PSScriptRoot $ExecutableName))

    if (-not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
        $candidatePaths.Add(
            (Join-Path $env:LOCALAPPDATA "Programs\povo-promo-code-notify\$ExecutableName")
        )
    }

    foreach ($candidatePath in $candidatePaths) {
        $expandedPath = [Environment]::ExpandEnvironmentVariables($candidatePath.Trim().Trim('"'))
        if (Test-Path -LiteralPath $expandedPath -PathType Leaf) {
            $resolvedPath = (Resolve-Path -LiteralPath $expandedPath).Path
            if ([IO.Path]::GetExtension($resolvedPath) -ine '.exe') {
                throw "実行ファイルには .exe を指定してください: $resolvedPath"
            }
            return $resolvedPath
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
        throw "アプリの実行ファイルが見つかりません: $RequestedPath"
    }

    while ($true) {
        $enteredPath = Read-Host 'povo-promo-code-notify.exe のフルパスを入力してください'
        $expandedPath = [Environment]::ExpandEnvironmentVariables($enteredPath.Trim().Trim('"'))

        if (Test-Path -LiteralPath $expandedPath -PathType Leaf) {
            $resolvedPath = (Resolve-Path -LiteralPath $expandedPath).Path
            if ([IO.Path]::GetExtension($resolvedPath) -ieq '.exe') {
                return $resolvedPath
            }
        }

        Write-Warning '有効な .exe ファイルを指定してください。'
    }
}

function Select-StartupMode {
    param([ValidateSet('Prompt', 'Window', 'Tray')][string]$RequestedMode)

    if ($RequestedMode -ne 'Prompt') {
        return $RequestedMode
    }

    $choices = [Management.Automation.Host.ChoiceDescription[]]@(
        [Management.Automation.Host.ChoiceDescription]::new(
            '表示して起動 (&W)',
            'ログオン時にメインウィンドウを表示します。'
        ),
        [Management.Automation.Host.ChoiceDescription]::new(
            'トレイへ起動 (&T)',
            'ログオン時にメインウィンドウを表示せず、タスクトレイへ常駐します。'
        )
    )

    $selection = $Host.UI.PromptForChoice(
        '起動方式を選択',
        'ユーザーログオン時の起動方式を選択してください。',
        $choices,
        1
    )

    if ($selection -eq 0) {
        return 'Window'
    }

    return 'Tray'
}

function Get-MatchingScheduledTask {
    param([string]$ResolvedExecutablePath)

    $normalizedExecutablePath = ConvertTo-NormalizedPath $ResolvedExecutablePath

    foreach ($task in Get-ScheduledTask -ErrorAction Stop) {
        $matchReasons = [Collections.Generic.List[string]]::new()

        if ($task.TaskName -eq $TaskName) {
            $matchReasons.Add('タスク名一致')
        }

        if (
            -not [string]::IsNullOrWhiteSpace($task.Description) -and
            $task.Description.IndexOf($TaskFingerprint, [StringComparison]::OrdinalIgnoreCase) -ge 0
        ) {
            $matchReasons.Add('指紋一致')
        }

        foreach ($action in @($task.Actions)) {
            $executeProperty = $action.PSObject.Properties['Execute']
            if ($null -eq $executeProperty) {
                continue
            }

            if ((ConvertTo-NormalizedPath ([string]$executeProperty.Value)) -eq $normalizedExecutablePath) {
                $matchReasons.Add('実行ファイル一致')
                break
            }
        }

        if ($matchReasons.Count -gt 0) {
            [PSCustomObject]@{
                Task       = $task
                MatchReason = $matchReasons -join '、'
            }
        }
    }
}

if (-not $IsWindows) {
    throw 'このスクリプトは Windows 専用です。'
}

Import-Module ScheduledTasks -ErrorAction Stop

$resolvedExecutablePath = Resolve-AppExecutable $ExecutablePath
$selectedStartupMode = Select-StartupMode $StartupMode
$matchingTasks = @(Get-MatchingScheduledTask $resolvedExecutablePath)

if ($matchingTasks.Count -gt 0) {
    Write-Information '' -InformationAction Continue
    Write-Information '既存の関連タスクが見つかりました:' -InformationAction Continue
    foreach ($matchingTask in $matchingTasks) {
        $task = $matchingTask.Task
        Write-Information `
            "  $($task.TaskPath)$($task.TaskName) [$($matchingTask.MatchReason)]" `
            -InformationAction Continue
    }

    $deleteChoices = [Management.Automation.Host.ChoiceDescription[]]@(
        [Management.Automation.Host.ChoiceDescription]::new(
            '削除して続行 (&Y)',
            '表示した既存タスクを削除して、新しいタスクを登録します。'
        ),
        [Management.Automation.Host.ChoiceDescription]::new(
            '中止 (&N)',
            '既存タスクを変更せず、登録処理を中止します。'
        )
    )

    $deleteSelection = $Host.UI.PromptForChoice(
        '既存タスクの削除確認',
        '上記のタスクを削除してよいですか？',
        $deleteChoices,
        1
    )

    if ($deleteSelection -ne 0) {
        Write-Warning '既存タスクを変更せず、登録処理を中止しました。'
        return
    }

    foreach ($matchingTask in $matchingTasks) {
        $task = $matchingTask.Task
        $qualifiedTaskName = "$($task.TaskPath)$($task.TaskName)"

        if ($PSCmdlet.ShouldProcess($qualifiedTaskName, '既存のスケジュール済みタスクを削除')) {
            Unregister-ScheduledTask `
                -TaskName $task.TaskName `
                -TaskPath $task.TaskPath `
                -Confirm:$false `
                -ErrorAction Stop
        }
    }
}

$actionParameters = @{
    Execute          = $resolvedExecutablePath
    WorkingDirectory = Split-Path -Parent $resolvedExecutablePath
}

if ($selectedStartupMode -eq 'Tray') {
    $actionParameters.Argument = '--start-in-tray'
}

$currentUserId = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$action = New-ScheduledTaskAction @actionParameters
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUserId
$principal = New-ScheduledTaskPrincipal `
    -UserId $currentUserId `
    -LogonType Interactive `
    -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -MultipleInstances IgnoreNew
$description = "povo プロモコード管理をユーザーログオン時に起動します。[$TaskFingerprint]"
$taskDefinition = New-ScheduledTask `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description $description

if ($PSCmdlet.ShouldProcess("$TaskPath$TaskName", 'ログオン時のスケジュール済みタスクを登録')) {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -TaskPath $TaskPath `
        -InputObject $taskDefinition `
        -ErrorAction Stop | Out-Null

    Write-Information '' -InformationAction Continue
    Write-Information 'タスクを登録しました。' -InformationAction Continue
    Write-Information "  タスク: $TaskPath$TaskName" -InformationAction Continue
    Write-Information "  ユーザー: $currentUserId" -InformationAction Continue
    Write-Information "  起動方式: $selectedStartupMode" -InformationAction Continue
    Write-Information "  実行ファイル: $resolvedExecutablePath" -InformationAction Continue
}
