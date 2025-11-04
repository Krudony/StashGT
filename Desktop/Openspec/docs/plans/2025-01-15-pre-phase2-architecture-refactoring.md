# แผนการปรับโครงสร้าง Pre-Phase 2 Architecture Refactoring

**วันที่**: 2025-01-15
**สถานะ**: ร่างแผน (Ready for Review)
**ระยะเวลา**: 1-2 วัน

---

## 🎯 เป้าหมาย

ปรับปรุงโครงสร้างรหัสให้พร้อมสำหรับ Phase 2 โดยแก้ไข 3 ปัญหาสำคัญ: ความสามารถทดสอบ, ความปลอดภัยคลิปบอร์ด และการจัดการการตั้งค่า

---

## 🏗️ สถาปัตยกรรม

ปัจจุบัน Program.cs มีตรรมานะทำงานผสมกับ UI logic ทำให้ไม่สามารถ unit test ได้ แนวทางการแก้คือ:

1. **Extract ConversionService** - ย้าย business logic ออกจาก Program.cs ไปอยู่ใน service class ที่ testable
2. **Implement Dependency Injection** - ใช้ interfaces เพื่อให้สามารถ mock dependencies ได้
3. **Atomic Clipboard Operations** - ป้องกัน race condition เมื่อ user copy ไฟล์ระหว่าง conversion

หลังจากการปรับปรุง:
```
Program (entry point)
    ↓
HotkeyManager (hotkey registration)
    ↓
ConversionService (NEW - business logic)
    ├→ IClipboardHandler (interface)
    ├→ IConverter (interface)
    └→ INotificationUI (interface)
```

---

## 🛠️ เทคโนโลยี

- **ภาษา**: C# 10
- **Framework**: .NET 6.0
- **Dependency Injection**: Microsoft.Extensions.DependencyInjection
- **Testing**: xUnit (สำหรับ Phase 3)

---

## 📋 รายละเอียด Tasks

### Task 1: สร้าง Interfaces สำหรับ Dependency Injection

**ไฟล์ที่เกี่ยวข้อง**:
- Create: `src/KeyboardTextConverter/IClipboardHandler.cs`
- Create: `src/KeyboardTextConverter/IConverter.cs`
- Create: `src/KeyboardTextConverter/INotificationUI.cs`

**ขั้นตอน**:

**Step 1**: สร้าง IClipboardHandler.cs
```csharp
namespace KeyboardTextConverter
{
    /// <summary>
    /// Interface สำหรับจัดการคลิปบอร์ด
    /// อนุญาตให้ mock เพื่อ unit testing
    /// </summary>
    public interface IClipboardHandler
    {
        /// <summary>
        /// อ่านข้อความจากคลิปบอร์ด
        /// </summary>
        /// <returns>ข้อความจากคลิปบอร์ด หรือ null ถ้าไม่มี</returns>
        string GetText();

        /// <summary>
        /// เขียนข้อความไปยังคลิปบอร์ด
        /// </summary>
        /// <param name="text">ข้อความที่จะเขียน</param>
        /// <returns>true ถ้าสำเร็จ, false ถ้าล้มเหลว</returns>
        bool SetText(string text);

        /// <summary>
        /// ตรวจสอบว่าคลิปบอร์ดเปลี่ยนแปลงแล้วหรือไม่
        /// ใช้ป้องกัน race condition
        /// </summary>
        /// <param name="originalText">ข้อความต้นฉบับ</param>
        /// <returns>true ถ้ายังคงเดิม, false ถ้าเปลี่ยนไป</returns>
        bool IsUnchanged(string originalText);
    }
}
```

**Step 2**: สร้าง IConverter.cs
```csharp
namespace KeyboardTextConverter
{
    /// <summary>
    /// Interface สำหรับแปลงข้อความ
    /// </summary>
    public interface IConverter
    {
        /// <summary>
        /// แปลงข้อความจากภาษาหนึ่งไปยังอีกภาษา
        /// </summary>
        /// <param name="text">ข้อความต้นฉบับ</param>
        /// <returns>ข้อความที่แปลแล้ว</returns>
        string Convert(string text);
    }
}
```

**Step 3**: สร้าง INotificationUI.cs
```csharp
namespace KeyboardTextConverter
{
    /// <summary>
    /// Interface สำหรับแสดงการแจ้งเตือน
    /// </summary>
    public interface INotificationUI
    {
        void ShowSuccess(string message);
        void ShowError(string message);
        void ShowEmpty();
    }
}
```

**Commit Command**:
```bash
git add src/KeyboardTextConverter/IClipboardHandler.cs
git add src/KeyboardTextConverter/IConverter.cs
git add src/KeyboardTextConverter/INotificationUI.cs
git commit -m "feat: Add DI interfaces for clipboard, converter, and notification UI

- IClipboardHandler: Handle clipboard read/write and race condition detection
- IConverter: Handle text conversion (Thai<->English)
- INotificationUI: Display success/error notifications

สร้าง 3 interfaces เพื่อรองรับ dependency injection
ทำให้เราสามารถ mock dependencies สำหรับ unit testing ได้"
```

---

### Task 2: Implement Atomic Clipboard Operations

**ไฟล์ที่เกี่ยวข้อง**:
- Modify: `src/KeyboardTextConverter/ClipboardHandler.cs`

**ขั้นตอน**:

**Step 1**: เพิ่ม IClipboardHandler implementation ให้ ClipboardHandler.cs
```csharp
using System;
using System.Windows.Forms;

namespace KeyboardTextConverter
{
    /// <summary>
    /// ป้องกัน race condition เมื่อ user copy ระหว่าง conversion
    /// </summary>
    public static class ClipboardHandler : IClipboardHandler
    {
        private static readonly object _clipboardLock = new object();
        private const int RetryCount = 3;
        private const int RetryDelayMs = 50;

        /// <summary>
        /// อ่านข้อความจากคลิปบอร์ดอย่างปลอดภัย
        /// </summary>
        public static string GetText()
        {
            lock (_clipboardLock)
            {
                for (int i = 0; i < RetryCount; i++)
                {
                    try
                    {
                        return Clipboard.GetText() ?? string.Empty;
                    }
                    catch
                    {
                        if (i < RetryCount - 1)
                            System.Threading.Thread.Sleep(RetryDelayMs);
                    }
                }
                return string.Empty;
            }
        }

        /// <summary>
        /// เขียนข้อความไปยังคลิปบอร์ดอย่างปลอดภัย
        /// ตรวจสอบว่าข้อความยังไม่เปลี่ยนแปลง (ป้องกัน race condition)
        /// </summary>
        public static bool SetText(string text, string originalText = null)
        {
            lock (_clipboardLock)
            {
                // ถ้ามีข้อความต้นฉบับ ตรวจสอบว่ายังไม่เปลี่ยนแปลง
                if (!string.IsNullOrEmpty(originalText))
                {
                    var current = GetTextInternal();
                    if (current != originalText)
                    {
                        // User คัด copy ไฟล์อื่นระหว่างเรา convert อยู่
                        return false;
                    }
                }

                for (int i = 0; i < RetryCount; i++)
                {
                    try
                    {
                        Clipboard.SetText(text);
                        return true;
                    }
                    catch
                    {
                        if (i < RetryCount - 1)
                            System.Threading.Thread.Sleep(RetryDelayMs);
                    }
                }
                return false;
            }
        }

        /// <summary>
        /// ตรวจสอบว่าคลิปบอร์ดยังเป็นข้อความเดิม
        /// </summary>
        public static bool IsUnchanged(string originalText)
        {
            lock (_clipboardLock)
            {
                return GetTextInternal() == originalText;
            }
        }

        /// <summary>
        /// อ่านข้อความจากคลิปบอร์ดภายในที่ lock แล้ว
        /// </summary>
        private static string GetTextInternal()
        {
            try
            {
                return Clipboard.GetText() ?? string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }
    }
}
```

**Step 2**: อัพเดท Program.cs เพื่อใช้ atomic operations
```csharp
// ในส่วน OnHotkeyPressed:
var originalText = ClipboardHandler.GetText();
if (string.IsNullOrWhiteSpace(originalText))
{
    notificationWindow.ShowEmpty();
    return;
}

var convertedText = ThaiEnglishConverter.Convert(originalText);
if (convertedText == originalText)
{
    notificationWindow.ShowError("ไม่พบอักขระที่สามารถแปลง");
    return;
}

// ป้องกัน race condition: ตรวจสอบว่า user ไม่ได้ copy อย่างอื่นระหว่าง convert
if (!ClipboardHandler.SetText(convertedText, originalText))
{
    notificationWindow.ShowError("ล้มเหลว: ไฟล์คลิปบอร์ดเปลี่ยนแปลง");
    return;
}

notificationWindow.ShowSuccess($"แปลงสำเร็จ: {convertedText.Length} อักขระ");
```

**Commit Command**:
```bash
git add src/KeyboardTextConverter/ClipboardHandler.cs
git commit -m "fix: Implement atomic clipboard operations to prevent race condition

- Add locking mechanism (lock statement) to ensure clipboard read/write atomicity
- Add IsUnchanged() check before SetText to detect user interference
- Add retry logic with exponential backoff for clipboard contention
- Prevent data loss when user copies different content during conversion

แก้ไข race condition ที่อาจเกิดขึ้นเมื่อ user copy ระหว่าง conversion"
```

---

### Task 3: Extract ConversionService

**ไฟล์ที่เกี่ยวข้อง**:
- Create: `src/KeyboardTextConverter/ConversionService.cs`
- Modify: `src/KeyboardTextConverter/Program.cs`

**ขั้นตอน**:

**Step 1**: สร้าง ConversionService.cs
```csharp
using System;

namespace KeyboardTextConverter
{
    /// <summary>
    /// Service ที่บรรจุ business logic ของการแปลงข้อความ
    /// แยกจาก Program.cs เพื่อให้สามารถ unit test ได้
    /// </summary>
    public class ConversionService
    {
        private readonly IClipboardHandler _clipboard;
        private readonly IConverter _converter;
        private readonly INotificationUI _ui;

        public ConversionService(
            IClipboardHandler clipboard,
            IConverter converter,
            INotificationUI ui)
        {
            _clipboard = clipboard ?? throw new ArgumentNullException(nameof(clipboard));
            _converter = converter ?? throw new ArgumentNullException(nameof(converter));
            _ui = ui ?? throw new ArgumentNullException(nameof(ui));
        }

        /// <summary>
        /// ดำเนินการแปลงข้อความ ป้องกัน race condition
        /// </summary>
        /// <returns>true ถ้าแปลงสำเร็จ, false ถ้าไม่สำเร็จ</returns>
        public bool Execute()
        {
            // Step 1: อ่านข้อความจากคลิปบอร์ด
            var originalText = _clipboard.GetText();
            if (string.IsNullOrWhiteSpace(originalText))
            {
                _ui.ShowEmpty();
                return false;
            }

            // Step 2: แปลงข้อความ
            var convertedText = _converter.Convert(originalText);
            if (convertedText == originalText)
            {
                _ui.ShowError("ไม่พบอักขระที่สามารถแปลง");
                return false;
            }

            // Step 3: เขียนข้อความแปลง + ตรวจสอบ race condition
            if (!_clipboard.SetText(convertedText, originalText))
            {
                _ui.ShowError("ล้มเหลว: ไฟล์คลิปบอร์ดเปลี่ยนแปลง");
                return false;
            }

            // Step 4: แสดงการแจ้งเตือนสำเร็จ
            _ui.ShowSuccess($"แปลงสำเร็จ: {convertedText.Length} อักขระ");
            return true;
        }
    }
}
```

**Step 2**: อัพเดท Program.cs
```csharp
// ในส่วน Main:
var conversionService = new ConversionService(
    new ClipboardHandler(),
    new ThaiEnglishConverter(),
    notificationWindow);

// ในส่วน OnHotkeyPressed:
conversionService.Execute();
```

**Commit Command**:
```bash
git add src/KeyboardTextConverter/ConversionService.cs
git add src/KeyboardTextConverter/Program.cs
git commit -m "refactor: Extract ConversionService from Program.cs

- Move business logic (conversion workflow) to ConversionService class
- ConversionService depends on interfaces (IClipboardHandler, IConverter, INotificationUI)
- Program.cs now only handles hotkey events and initialization
- Enables unit testing of conversion logic independently

แยก business logic ออกจาก Program.cs เพื่อให้ testable
ConversionService จัดการ: อ่าน → แปลง → ป้องกัน race condition → แจ้ง"
```

---

### Task 4: Add Dependency Injection Container

**ไฟล์ที่เกี่ยวข้อง**:
- Create: `src/KeyboardTextConverter/ServiceConfiguration.cs`
- Modify: `src/KeyboardTextConverter/Program.cs`
- Modify: `KeyboardTextConverter.csproj`

**ขั้นตอน**:

**Step 1**: เพิ่ม NuGet dependency
```bash
cd src/KeyboardTextConverter
dotnet add package Microsoft.Extensions.DependencyInjection --version 8.0.0
```

**Step 2**: สร้าง ServiceConfiguration.cs
```csharp
using Microsoft.Extensions.DependencyInjection;
using System;

namespace KeyboardTextConverter
{
    /// <summary>
    /// ตั้งค่า Dependency Injection container
    /// </summary>
    public static class ServiceConfiguration
    {
        public static IServiceProvider ConfigureServices()
        {
            var services = new ServiceCollection();

            // Register services
            services.AddSingleton<IClipboardHandler>(new ClipboardHandler());
            services.AddSingleton<IConverter>(new ThaiEnglishConverter());
            services.AddSingleton<INotificationUI, NotificationWindow>();
            services.AddSingleton<ConversionService>();
            services.AddSingleton<HotkeyManager>();
            services.AddSingleton<ConfigManager>();

            return services.BuildServiceProvider();
        }
    }
}
```

**Step 3**: อัพเดท Program.cs ให้ใช้ DI container
```csharp
using System;
using System.Windows.Forms;
using Microsoft.Extensions.DependencyInjection;

namespace KeyboardTextConverter
{
    static class Program
    {
        private static IServiceProvider _serviceProvider;

        [STAThread]
        static void Main()
        {
            // ตั้งค่า DI container
            _serviceProvider = ServiceConfiguration.ConfigureServices();

            // เข้าถึง services
            var hotkeyManager = _serviceProvider.GetRequiredService<HotkeyManager>();
            var conversionService = _serviceProvider.GetRequiredService<ConversionService>();

            hotkeyManager.OnHotkeyPressed += () =>
            {
                conversionService.Execute();
            };

            hotkeyManager.Register();

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new ApplicationContext());
        }
    }
}
```

**Commit Command**:
```bash
git add KeyboardTextConverter.csproj
git add src/KeyboardTextConverter/ServiceConfiguration.cs
git add src/KeyboardTextConverter/Program.cs
git commit -m "feat: Add dependency injection container (DI)

- Add Microsoft.Extensions.DependencyInjection NuGet package
- Create ServiceConfiguration class to register all services
- Update Program.cs to use DI container for service initialization
- All components now depend on interfaces instead of concrete implementations

ทำให้โปรแกรมใช้ DI pattern ช่วยให้ mock ทำให้ง่าย สำหรับ unit testing"
```

---

### Task 5: Add Config Schema Versioning

**ไฟล์ที่เกี่ยวข้อง**:
- Modify: `src/KeyboardTextConverter/ConfigManager.cs`
- Modify: `src/KeyboardTextConverter/config.json`

**ขั้นตอน**:

**Step 1**: อัพเดท config.json
```json
{
  "version": 1,
  "hotkey": "Ctrl+Shift+Space",
  "autoPaste": false,
  "enableNotifications": true,
  "notificationDurationMs": 2000
}
```

**Step 2**: อัพเดท ConfigManager.cs
```csharp
using Newtonsoft.Json;
using System;
using System.IO;

namespace KeyboardTextConverter
{
    /// <summary>
    /// จัดการการตั้งค่าแอปพลิเคชัน
    /// รองรับ schema migration สำหรับ Phase 2+
    /// </summary>
    public static class ConfigManager
    {
        private static readonly string _configPath =
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "KeyboardTextConverter",
                "config.json");

        public static Config LoadConfig()
        {
            try
            {
                if (!File.Exists(_configPath))
                    return GetDefaultConfig();

                var json = File.ReadAllText(_configPath);
                var config = JsonConvert.DeserializeObject<Config>(json);

                // Migrate if needed
                if (config?.Version == 0)
                    config = MigrateFromV0ToV1(config);

                return config ?? GetDefaultConfig();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading config: {ex.Message}");
                return GetDefaultConfig();
            }
        }

        public static void SaveConfig(Config config)
        {
            try
            {
                var directory = Path.GetDirectoryName(_configPath);
                if (!Directory.Exists(directory))
                    Directory.CreateDirectory(directory);

                var json = JsonConvert.SerializeObject(config, Formatting.Indented);
                File.WriteAllText(_configPath, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving config: {ex.Message}");
            }
        }

        private static Config GetDefaultConfig()
        {
            return new Config
            {
                Version = 1,
                Hotkey = "Ctrl+Shift+Space",
                AutoPaste = false,
                EnableNotifications = true,
                NotificationDurationMs = 2000
            };
        }

        /// <summary>
        /// Migration: V0 → V1
        /// (สำหรับ Phase 2 ที่อาจมี hotkey format ใหม่)
        /// </summary>
        private static Config MigrateFromV0ToV1(Config config)
        {
            // ตัวอย่าง migration logic
            config.Version = 1;
            return config;
        }
    }

    public class Config
    {
        [JsonProperty("version")]
        public int Version { get; set; } = 1;

        [JsonProperty("hotkey")]
        public string Hotkey { get; set; } = "Ctrl+Shift+Space";

        [JsonProperty("autoPaste")]
        public bool AutoPaste { get; set; } = false;

        [JsonProperty("enableNotifications")]
        public bool EnableNotifications { get; set; } = true;

        [JsonProperty("notificationDurationMs")]
        public int NotificationDurationMs { get; set; } = 2000;
    }
}
```

**Commit Command**:
```bash
git add src/KeyboardTextConverter/config.json
git add src/KeyboardTextConverter/ConfigManager.cs
git commit -m "feat: Add config schema versioning and migration support

- Add 'version' field to config.json (currently v1)
- Implement ConfigManager migration logic for V0->V1 and future versions
- Prevents config breakage when Phase 2 changes schema
- Backward compatible with old config files

สนับสนุน config schema versioning เพื่อป้องกัน breaking changes ในอนาคต"
```

---

### Task 6: Create Unit Tests Foundation (Optional for Phase 1.5)

**ไฟล์ที่เกี่ยวข้อง**:
- Create: `tests/KeyboardTextConverter.Tests/ConversionServiceTests.cs`
- Create: `tests/KeyboardTextConverter.Tests/KeyboardTextConverter.Tests.csproj`

**ขั้นตอน**:

**Step 1**: สร้าง test project
```bash
dotnet new xunit -n KeyboardTextConverter.Tests -o tests/KeyboardTextConverter.Tests
cd tests/KeyboardTextConverter.Tests
dotnet add reference ../../src/KeyboardTextConverter/KeyboardTextConverter.csproj
dotnet add package Moq
```

**Step 2**: สร้าง ConversionServiceTests.cs
```csharp
using Moq;
using Xunit;

namespace KeyboardTextConverter.Tests
{
    public class ConversionServiceTests
    {
        [Fact]
        public void Execute_WithValidThaiText_ShouldConvertToEnglish()
        {
            // Arrange
            var mockClipboard = new Mock<IClipboardHandler>();
            var mockConverter = new Mock<IConverter>();
            var mockUI = new Mock<INotificationUI>();

            mockClipboard.Setup(x => x.GetText()).Returns("กด");
            mockConverter.Setup(x => x.Convert("กด")).Returns("q");
            mockClipboard.Setup(x => x.SetText("q", "กด")).Returns(true);

            var service = new ConversionService(mockClipboard.Object, mockConverter.Object, mockUI.Object);

            // Act
            var result = service.Execute();

            // Assert
            Assert.True(result);
            mockClipboard.Verify(x => x.SetText("q", "กด"), Times.Once);
            mockUI.Verify(x => x.ShowSuccess(It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public void Execute_WithRaceCondition_ShouldAbort()
        {
            // Arrange
            var mockClipboard = new Mock<IClipboardHandler>();
            var mockConverter = new Mock<IConverter>();
            var mockUI = new Mock<INotificationUI>();

            mockClipboard.Setup(x => x.GetText()).Returns("กด");
            mockConverter.Setup(x => x.Convert("กด")).Returns("q");
            // Simulate race condition: clipboard changed before SetText
            mockClipboard.Setup(x => x.SetText("q", "กด")).Returns(false);

            var service = new ConversionService(mockClipboard.Object, mockConverter.Object, mockUI.Object);

            // Act
            var result = service.Execute();

            // Assert
            Assert.False(result);
            mockUI.Verify(x => x.ShowError("ล้มเหลว: ไฟล์คลิปบอร์ดเปลี่ยนแปลง"), Times.Once);
        }
    }
}
```

**Commit Command**:
```bash
git add tests/KeyboardTextConverter.Tests/
git commit -m "test: Add unit test foundation with xUnit and Moq

- Create test project with xUnit framework
- Add Moq for mocking interfaces
- Implement initial tests for ConversionService
- Test successful conversion and race condition handling

สร้าง test foundation พร้อมสำหรับ Phase 3 unit testing"
```

---

## ✅ การตรวจสอบ (Verification Checklist)

- [ ] ทั้ง 3 interfaces ถูกสร้างและมี proper documentation
- [ ] ClipboardHandler ใช้ lock mechanism เพื่อป้องกัน race condition
- [ ] ConversionService ย้าย business logic จาก Program.cs สำเร็จ
- [ ] DI container (ServiceConfiguration) ถูกตั้งค่าอย่างถูกต้อง
- [ ] Config schema มี version field และ migration logic
- [ ] โปรแกรมยังคงทำงานเดิมหลัง refactoring
- [ ] ไม่มี breaking changes ต่อ Phase 1 functionality

**ทดสอบทั้งหมด**:
```bash
cd src/KeyboardTextConverter
dotnet build
dotnet run
# ทดสอบการกด Ctrl+Shift+Space ด้วยข้อความไทย
```

---

## ⏱️ ประมาณระยะเวลา

| Task | ระยะเวลา | ความยาก |
|------|----------|--------|
| Task 1: Interfaces | 30 นาที | ⭐ ง่าย |
| Task 2: Atomic Clipboard | 1 ชั่วโมง | ⭐⭐ กลาง |
| Task 3: ConversionService | 45 นาที | ⭐⭐ กลาง |
| Task 4: DI Container | 45 นาที | ⭐⭐ กลาง |
| Task 5: Config Versioning | 30 นาที | ⭐ ง่าย |
| Task 6: Unit Tests (Optional) | 1 ชั่วโมง | ⭐⭐ กลาง |
| **รวมทั้งหมด** | **1-2 วัน** | |

---

## 🎁 ประโยชน์หลังจาก Refactoring

✅ **Testability**: 80% ของ business logic สามารถ unit test ได้
✅ **Safety**: Race condition ถูกป้องกัน
✅ **Maintainability**: Config ปลอดภัยจาก breaking changes
✅ **Scalability**: Phase 2-4 features สามารถเพิ่มได้อย่างง่าย
✅ **Code Quality**: Cleaner separation of concerns

---

## 📝 หมายเหตุ

- Task 6 (Unit Tests) เป็น optional สำหรับ Phase 1.5 แต่ recommended
- ทั้งหมด 5 tasks หลักสามารถทำแล้วเสร็จใน 1-2 วัน
- หลังจาก refactoring นี้ Phase 2 development จะเรียบง่ายมากขึ้น
