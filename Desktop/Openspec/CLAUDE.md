# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Project Overview

**Hotkey-Based Thai-English Text Converter** - A Windows desktop application (C# .NET 6.0) that fixes keyboard layout typing mistakes. When a user accidentally types in the wrong keyboard layout, pressing `Ctrl+Shift+Space` converts the text to the correct language and updates the clipboard automatically.

**Status**: Phase 1 (Core MVP) complete and production-ready (~906 LOC).

## Technology Stack

- **Language**: C# 10
- **Framework**: .NET 6.0 (managed runtime)
- **UI**: Windows Forms (single hidden window for hotkey messages)
- **Platform**: Windows 10/11 only
- **Key APIs**: Windows P/Invoke (RegisterHotKey, clipboard, window creation)
- **Config**: JSON (Newtonsoft.Json v13.0.3)
- **Build**: .NET SDK (`dotnet` CLI)
- **Output**: Single standalone .exe file

## Common Development Commands

```bash
# Navigate to project root
cd src/KeyboardTextConverter

# Build (Debug)
dotnet build

# Build (Release - optimized, smaller)
dotnet build -c Release

# Run the application (Debug)
dotnet run

# Run the application (Release)
dotnet run -c Release

# Publish as single .exe file
dotnet publish -c Release -f net6.0-windows
# Output: bin/Release/net6.0-windows/publish/KeyboardTextConverter.exe

# Clean build artifacts
dotnet clean
```

## Architecture

The application follows an **event-driven, modular architecture**:

```
User presses Ctrl+Shift+Space
         ↓
    HotkeyManager (Windows P/Invoke RegisterHotKey)
         ↓
    Program.OnHotkeyPressed() [Event handler]
    ├→ ClipboardHandler.GetText()
    ├→ ThaiEnglishConverter.Convert()
    ├→ ClipboardHandler.SetText()
    └→ NotificationWindow.Show()
         ↓
    User pastes converted text (Ctrl+V)
```

### Core Components

| Component | Purpose | Key Files |
|-----------|---------|-----------|
| **Program** | Entry point & hotkey event handler | Program.cs (90 LOC) |
| **HotkeyManager** | Global hotkey registration via Windows API | HotkeyManager.cs (180 LOC) |
| **ThaiEnglishConverter** | Character mapping logic (100+ mappings) | ThaiEnglishConverter.cs (300 LOC) |
| **ClipboardHandler** | Clipboard I/O with retry logic | ClipboardHandler.cs (80 LOC) |
| **NotificationWindow** | Floating UI notification (Toast) | NotificationWindow.cs (150 LOC) |
| **ConfigManager** | Config file loading/saving | ConfigManager.cs (80 LOC) |

### Design Patterns

- **Event-driven**: Hotkey press triggers async event chain
- **Separation of concerns**: Each component has single responsibility
- **Error handling**: Comprehensive try-catch on all critical paths
- **Resource management**: IDisposable patterns used
- **Resilience**: Clipboard retry logic handles contention
- **Configuration**: JSON-based with automatic defaults

## Configuration

**Location**: `%APPDATA%\KeyboardTextConverter\config.json`

**Default**:
```json
{
  "hotkey": "Ctrl+Shift+Space",
  "autoPaste": false,
  "enableNotifications": true,
  "notificationDurationMs": 2000
}
```

Handled by ConfigManager.cs - automatically creates with defaults if missing.

## Important Notes for Development

### Windows API Integration
- Uses P/Invoke for `RegisterHotKey` / `UnregisterHotKey`
- Requires hidden window created with `CreateWindowEx` to receive WM_HOTKEY messages
- Standard clipboard APIs via Interop namespace

### Single-File Publishing
- Project configured with `<PublishSingleFile>true</PublishSingleFile>` in .csproj
- Produces standalone .exe with no dependencies (except .NET 6.0 runtime)

### Platform Specificity
- Windows only (uses `<UseWindowsForms>true</UseWindowsForms>`)
- Requires .NET 6.0 Windows Desktop SDK
- No admin privileges needed

### Performance Targets (All Met in Phase 1)
- Hotkey response: < 10ms
- Conversion time: < 50ms
- Total latency: < 100ms
- Memory idle: ~5-8MB
- CPU idle: ~0.1-0.5%
- Startup: < 1 second

## Reference Files

| File | Purpose |
|------|---------|
| `@/PROJECT_OVERVIEW.md` | Comprehensive project guide |
| `@/openspec/AGENTS.md` | OpenSpec workflow instructions |
| `@/openspec/changes/simplify-ime-to-hotkey-converter/specs/hotkey-text-converter/spec.md` | 7 core requirements + 30+ test scenarios |
| `@/FINAL_PROJECT_STATUS.md` | Phase 1 completion summary |
| `@/src/KeyboardTextConverter/README.md` | User documentation & troubleshooting |

## Phase Roadmap

- **Phase 1** ✅ Complete: Core hotkey converter (7 components, 906 LOC)
- **Phase 2** ⏳ Pending: System tray, settings dialog, auto-paste feature
- **Phase 3** ⏳ Pending: Unit tests, integration tests, stability improvements
- **Phase 4** ⏳ Pending: Documentation & release packaging