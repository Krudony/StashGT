using System;
using System.Drawing;
using System.Windows.Forms;

namespace KeyboardTextConverter;

/// <summary>
/// Hidden main form that serves as the application's message loop foundation.
/// Required for System Tray support and proper Windows message handling.
/// </summary>
public class HiddenMainForm : Form
{
    private NotifyIcon? trayIcon;
    private HotkeyManager? hotkeyManager;
    private NotificationWindow? notificationWindow;
    private ConfigManager.Config? config;

    public HiddenMainForm()
    {
        InitializeComponents();
        LoadApplicationComponents();
    }

    /// <summary>
    /// Initialize the hidden form properties.
    /// </summary>
    private void InitializeComponents()
    {
        // Form should be completely hidden
        this.ShowInTaskbar = false;
        this.WindowState = FormWindowState.Minimized;
        this.FormBorderStyle = FormBorderStyle.None;
        this.Text = "Keyboard Text Converter";
        this.ClientSize = new Size(0, 0);
        this.Visible = false;
        this.Opacity = 0;
    }

    /// <summary>
    /// Load and initialize all application components.
    /// </summary>
    private void LoadApplicationComponents()
    {
        try
        {
            // Load configuration
            config = ConfigManager.LoadConfig();
            Console.WriteLine($"Configuration loaded. Hotkey: {config.Hotkey}");

            // Create core components
            hotkeyManager = new HotkeyManager();
            notificationWindow = new NotificationWindow();

            // Setup hotkey event handler
            hotkeyManager.HotkeyPressed += (sender, e) =>
            {
                OnHotkeyPressed(hotkeyManager!, notificationWindow!);
            };

            // Start listening for hotkey
            hotkeyManager.StartListening();
            Console.WriteLine("Hotkey listener started.");

            // TODO: Initialize System Tray (Phase 2.1)
            // InitializeTrayIcon();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Error initializing components:\n\n{ex.Message}\n\n{ex.StackTrace}",
                "Keyboard Text Converter Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }
    }

    /// <summary>
    /// Handle hotkey press event with thread safety.
    /// Gets clipboard, converts, and shows notification.
    /// </summary>
    private static void OnHotkeyPressed(HotkeyManager hotkeyManager, NotificationWindow notificationWindow)
    {
        try
        {
            // Get text from clipboard
            var originalText = ClipboardHandler.GetText();

            // Check if clipboard is empty
            if (string.IsNullOrWhiteSpace(originalText))
            {
                notificationWindow.ShowEmpty();
                return;
            }

            // Convert text
            var convertedText = ThaiEnglishConverter.Convert(originalText);

            // Check if conversion changed anything
            if (convertedText == originalText)
            {
                notificationWindow.ShowError("No mappable characters found");
                return;
            }

            // Update clipboard with converted text
            if (!ClipboardHandler.SetText(convertedText))
            {
                notificationWindow.ShowError("Failed to update clipboard");
                return;
            }

            // Show success notification with conversion direction and preview
            var direction = ThaiEnglishConverter.GetConversionDirection(originalText);
            string originalPreview = originalText.Length > 15
                ? originalText.Substring(0, 15) + "..."
                : originalText;
            string convertedPreview = convertedText.Length > 15
                ? convertedText.Substring(0, 15) + "..."
                : convertedText;

            notificationWindow.ShowSuccess(direction, originalPreview, convertedPreview);
            Console.WriteLine($"Converted: {originalPreview} → {convertedPreview}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during conversion: {ex.Message}");
            notificationWindow.ShowError("Conversion error");
        }
    }

    /// <summary>
    /// TODO: Initialize System Tray icon (Phase 2.1)
    /// </summary>
    private void InitializeTrayIcon()
    {
        // This will be implemented in Phase 2.1
        // trayIcon = new NotifyIcon();
        // trayIcon.Text = "Keyboard Text Converter";
        // trayIcon.DoubleClick += (s, e) => ShowSettings();
        // etc.
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            hotkeyManager?.Dispose();
            notificationWindow?.Dispose();
            trayIcon?.Dispose();
        }
        base.Dispose(disposing);
    }

    protected override void SetVisibleCore(bool value)
    {
        // Never show the form
        base.SetVisibleCore(false);
    }
}