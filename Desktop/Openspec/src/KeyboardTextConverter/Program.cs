using System;
using System.Windows.Forms;

namespace KeyboardTextConverter;

/// <summary>
/// Main application entry point.
/// Initializes the hidden main form and runs the message loop.
/// Updated for Phase 2 to support System Tray and proper UI component lifecycle.
/// </summary>
static class Program
{
    [STAThread]
    static void Main()
    {
        // Enable visual styles
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        try
        {
            Console.WriteLine("Starting Keyboard Text Converter...");

            // Create and run the hidden main form
            // This replaces ApplicationContext() to support System Tray components
            var mainForm = new HiddenMainForm();
            Application.Run(mainForm);

            Console.WriteLine("Application shutdown complete.");
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Error starting application:\n\n{ex.Message}\n\n{ex.StackTrace}",
                "Keyboard Text Converter Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }
    }
}
