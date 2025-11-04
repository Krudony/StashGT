using System;
using System.IO;
using System.Text.RegularExpressions;
using Newtonsoft.Json;

namespace KeyboardTextConverter;

/// <summary>
/// Manages application configuration loading and saving with validation.
/// Updated for Phase 2 to include hotkey validation and error handling.
/// </summary>
public class ConfigManager
{
    private static readonly string CONFIG_DIR = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "KeyboardTextConverter"
    );

    private static readonly string CONFIG_FILE = Path.Combine(CONFIG_DIR, "config.json");

    public class Config
    {
        [JsonProperty("hotkey")]
        public string Hotkey { get; set; } = "Ctrl+Shift+Space";

        [JsonProperty("autoPaste")]
        public bool AutoPaste { get; set; } = false;

        [JsonProperty("enableNotifications")]
        public bool EnableNotifications { get; set; } = true;

        [JsonProperty("notificationDurationMs")]
        public int NotificationDurationMs { get; set; } = 2000;
    }

    /// <summary>
    /// Load configuration from config.json or create default.
    /// </summary>
    public static Config LoadConfig()
    {
        try
        {
            // Create config directory if it doesn't exist
            if (!Directory.Exists(CONFIG_DIR))
            {
                Directory.CreateDirectory(CONFIG_DIR);
            }

            // Load existing config or create default
            if (File.Exists(CONFIG_FILE))
            {
                string json = File.ReadAllText(CONFIG_FILE);
                var config = JsonConvert.DeserializeObject<Config>(json);
                return config ?? new Config();
            }
            else
            {
                // Create default config
                var defaultConfig = new Config();
                SaveConfig(defaultConfig);
                return defaultConfig;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading config: {ex.Message}");
            return new Config();
        }
    }

    /// <summary>
    /// Save configuration to config.json.
    /// </summary>
    public static void SaveConfig(Config config)
    {
        try
        {
            if (!Directory.Exists(CONFIG_DIR))
            {
                Directory.CreateDirectory(CONFIG_DIR);
            }

            string json = JsonConvert.SerializeObject(config, Formatting.Indented);
            File.WriteAllText(CONFIG_FILE, json);
            Console.WriteLine($"Config saved to: {CONFIG_FILE}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error saving config: {ex.Message}");
        }
    }

    /// <summary>
    /// Get the path to the config file.
    /// </summary>
    public static string GetConfigPath()
    {
        return CONFIG_FILE;
    }

    /// <summary>
    /// Validate hotkey format and return validation result.
    /// </summary>
    public static (bool IsValid, string ErrorMessage) ValidateHotkey(string hotkey)
    {
        if (string.IsNullOrWhiteSpace(hotkey))
        {
            return (false, "Hotkey cannot be empty");
        }

        // Allow patterns: Ctrl+Shift+Space, Alt+Shift+C, Ctrl+Alt+X, etc.
        var validPattern = @"^(Ctrl|Alt|Shift)(\+(Ctrl|Alt|Shift))*\+[A-Za-z0-9]$|^(Ctrl|Alt|Shift)(\+(Ctrl|Alt|Shift))*\+Space$";

        if (!Regex.IsMatch(hotkey.Trim(), validPattern, RegexOptions.IgnoreCase))
        {
            return (false, $"Invalid hotkey format: '{hotkey}'. Expected format: Ctrl+Shift+Space, Alt+Shift+C, etc.");
        }

        return (true, string.Empty);
    }

    /// <summary>
    /// Validate notification duration.
    /// </summary>
    public static (bool IsValid, string ErrorMessage) ValidateNotificationDuration(int duration)
    {
        if (duration < 500 || duration > 10000)
        {
            return (false, $"Notification duration must be between 500ms and 10000ms (got: {duration})");
        }
        return (true, string.Empty);
    }

    /// <summary>
    /// Validate entire config object.
    /// </summary>
    public static (bool IsValid, string[] Errors) ValidateConfig(Config config)
    {
        var errors = new List<string>();

        // Validate hotkey
        var (hotkeyValid, hotkeyError) = ValidateHotkey(config.Hotkey);
        if (!hotkeyValid)
        {
            errors.Add(hotkeyError);
        }

        // Validate notification duration
        var (durationValid, durationError) = ValidateNotificationDuration(config.NotificationDurationMs);
        if (!durationValid)
        {
            errors.Add(durationError);
        }

        return (errors.Count == 0, errors.ToArray());
    }

    /// <summary>
    /// Save configuration with validation.
    /// </summary>
    public static (bool Success, string ErrorMessage) SaveConfigValidated(Config config)
    {
        try
        {
            // Validate config before saving
            var (isValid, errors) = ValidateConfig(config);
            if (!isValid)
            {
                return (false, $"Configuration validation failed: {string.Join(", ", errors)}");
            }

            SaveConfig(config);
            return (true, string.Empty);
        }
        catch (Exception ex)
        {
            return (false, $"Error saving config: {ex.Message}");
        }
    }
}
