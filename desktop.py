import os
import sys
import threading
import time
import webbrowser
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

from PySide6.QtCore import QTimer, QUrl, Qt
from PySide6.QtGui import QAction, QIcon, QKeySequence
from PySide6.QtWidgets import QApplication, QFileDialog, QMainWindow, QMessageBox, QStatusBar
from PySide6.QtWebEngineCore import QWebEngineDownloadRequest, QWebEnginePage
from PySide6.QtWebEngineWidgets import QWebEngineView

from app import DEFAULT_APP_HOST, DEFAULT_APP_PORT, INTERNAL_DIR, find_available_port, get_output_dir, start_server


APP_TITLE = "deutschmark's Alert! Alert!"
APP_HOST = DEFAULT_APP_HOST
APP_PORT = find_available_port(APP_HOST, DEFAULT_APP_PORT)
APP_URL = f"http://{APP_HOST}:{APP_PORT}"
INTERNAL_NAV_HOSTS = {APP_HOST, "", "localhost", "auth.deutschmark.online", "id.twitch.tv", "passport.twitch.tv"}


def wait_for_server(timeout_seconds=25):
    health_url = f"{APP_URL}/api/health"
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        try:
            request = Request(health_url, headers={"Cache-Control": "no-cache"})
            with urlopen(request, timeout=1.5) as response:
                if response.status == 200:
                    return True
        except URLError:
            pass
        QThreadSleeper.sleep(150)
    return False


class QThreadSleeper:
    @staticmethod
    def sleep(milliseconds):
        loop = QApplication.instance()
        if loop:
            loop.processEvents()
        threading.Event().wait(milliseconds / 1000)


class DesktopPage(QWebEnginePage):
    def acceptNavigationRequest(self, url, nav_type, is_main_frame):
        if url.host() not in INTERNAL_NAV_HOSTS and url.scheme() in {"http", "https"}:
            webbrowser.open(url.toString())
            return False
        return super().acceptNavigationRequest(url, nav_type, is_main_frame)


class DesktopWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle(APP_TITLE)
        self.setMinimumSize(1360, 860)
        icon_path = INTERNAL_DIR / "static" / "favicon.ico"
        if icon_path.exists():
            self.setWindowIcon(QIcon(str(icon_path)))

        self.view = QWebEngineView(self)
        self.page = DesktopPage(self.view)
        self.view.setPage(self.page)
        self.setCentralWidget(self.view)
        self._build_menubar()
        self._build_statusbar()
        self.view.page().profile().downloadRequested.connect(self.handle_download_requested)
        self.view.loadFinished.connect(self._on_loaded)

    def _build_menubar(self):
        mb = self.menuBar()

        # ── File ────────────────────────────────────────────────────────────
        file_menu = mb.addMenu("&File")

        open_folder = QAction("Open Output Folder", self)
        open_folder.setShortcut(QKeySequence("Ctrl+Shift+O"))
        open_folder.setStatusTip("Open the folder where finished exports are saved")
        open_folder.triggered.connect(self._open_output_folder)
        file_menu.addAction(open_folder)

        open_browser = QAction("Open in Browser", self)
        open_browser.setShortcut(QKeySequence("Ctrl+Shift+B"))
        open_browser.setStatusTip("Open the app in your default web browser")
        open_browser.triggered.connect(lambda: webbrowser.open(APP_URL))
        file_menu.addAction(open_browser)

        file_menu.addSeparator()

        exit_action = QAction("Exit", self)
        exit_action.setShortcut(QKeySequence("Ctrl+Q"))
        exit_action.setStatusTip("Quit Alert! Alert!")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

        # ── Edit ────────────────────────────────────────────────────────────
        edit_menu = mb.addMenu("&Edit")

        reset_action = QAction("Reset to Defaults", self)
        reset_action.setStatusTip("Reset all app settings to their defaults")
        reset_action.triggered.connect(self._reset_settings)
        edit_menu.addAction(reset_action)

        # ── View ────────────────────────────────────────────────────────────
        view_menu = mb.addMenu("&View")

        reload_action = QAction("Reload", self)
        reload_action.setShortcut(QKeySequence("F5"))
        reload_action.setStatusTip("Reload the app")
        reload_action.triggered.connect(self.view.reload)
        view_menu.addAction(reload_action)

        back_action = QAction("Back", self)
        back_action.setShortcut(QKeySequence("Alt+Left"))
        back_action.triggered.connect(self.view.back)
        view_menu.addAction(back_action)

        fwd_action = QAction("Forward", self)
        fwd_action.setShortcut(QKeySequence("Alt+Right"))
        fwd_action.triggered.connect(self.view.forward)
        view_menu.addAction(fwd_action)

        view_menu.addSeparator()

        zoom_in = QAction("Zoom In", self)
        zoom_in.setShortcut(QKeySequence("Ctrl+="))
        zoom_in.triggered.connect(self._zoom_in)
        view_menu.addAction(zoom_in)

        zoom_out = QAction("Zoom Out", self)
        zoom_out.setShortcut(QKeySequence("Ctrl+-"))
        zoom_out.triggered.connect(self._zoom_out)
        view_menu.addAction(zoom_out)

        zoom_reset = QAction("Reset Zoom", self)
        zoom_reset.setShortcut(QKeySequence("Ctrl+0"))
        zoom_reset.triggered.connect(self._zoom_reset)
        view_menu.addAction(zoom_reset)

        view_menu.addSeparator()

        mode_menu = view_menu.addMenu("Mode")
        alert_mode = QAction("Alert Creator", self)
        alert_mode.triggered.connect(lambda: self._switch_mode("alert"))
        mode_menu.addAction(alert_mode)
        reel_mode = QAction("Video Editor", self)
        reel_mode.triggered.connect(lambda: self._switch_mode("reel"))
        mode_menu.addAction(reel_mode)

        # ── Help ────────────────────────────────────────────────────────────
        help_menu = mb.addMenu("&Help")

        deps_action = QAction("Dependency Setup", self)
        deps_action.setStatusTip("Check and install required tools")
        deps_action.triggered.connect(self._open_dep_settings)
        help_menu.addAction(deps_action)

        help_menu.addSeparator()

        shortcuts_action = QAction("Keyboard Shortcuts", self)
        shortcuts_action.setShortcut(QKeySequence("?"))
        shortcuts_action.setStatusTip("Show keyboard shortcut reference")
        shortcuts_action.triggered.connect(lambda: self.view.page().runJavaScript("App.toggleShortcutHelp()"))
        help_menu.addAction(shortcuts_action)

        help_menu.addSeparator()

        about_action = QAction("About", self)
        about_action.triggered.connect(self._show_about)
        help_menu.addAction(about_action)

    # ── Menu action helpers ──────────────────────────────────────────────────

    def _open_output_folder(self):
        folder = get_output_dir()
        folder.mkdir(parents=True, exist_ok=True)
        os.startfile(str(folder))

    def _reset_settings(self):
        self.view.page().runJavaScript("App.resetSettings()")

    def _zoom_in(self):
        self.view.setZoomFactor(min(self.view.zoomFactor() + 0.1, 3.0))

    def _zoom_out(self):
        self.view.setZoomFactor(max(self.view.zoomFactor() - 0.1, 0.3))

    def _zoom_reset(self):
        self.view.setZoomFactor(1.0)

    def _switch_mode(self, mode):
        self.view.page().runJavaScript(f"switchMode('{mode}')")

    def _open_dep_settings(self):
        self.view.page().runJavaScript("App.toggleSettingsPanel('dependency-settings-panel')")

    def _show_about(self):
        QMessageBox.about(
            self,
            "About Alert! Alert!",
            "<b>deutschmark's Alert! Alert!</b><br><br>"
            "A desktop tool for streamers to quickly trim, crop, and export<br>"
            "short-form clips and reels from stream VODs.<br><br>"
            "Built with Flask + PySide6.",
        )

    def _build_statusbar(self):
        status = QStatusBar(self)
        status.showMessage("Starting local app server...")
        self.setStatusBar(status)

    def load_app(self):
        self.view.setUrl(QUrl(APP_URL))

    def _on_loaded(self, ok):
        if ok:
            self.statusBar().showMessage("Ready", 3000)
        else:
            self.statusBar().showMessage("Failed to load app UI.")

    def handle_download_requested(self, download: QWebEngineDownloadRequest):
        suggested_name = download.downloadFileName() or "alert-alert-download.bin"
        ext = Path(suggested_name).suffix.lower()
        if ext in {".srt", ".ass", ".vtt", ".sub"}:
            file_filter = "Subtitles (*.srt *.ass *.vtt *.sub);;All Files (*.*)"
        elif ext in {".mp3", ".wav", ".aac", ".flac", ".ogg"}:
            file_filter = "Audio (*.mp3 *.wav *.aac *.flac *.ogg);;All Files (*.*)"
        else:
            file_filter = "Videos (*.mp4 *.mov *.mkv *.webm);;All Files (*.*)"
        target_path, _ = QFileDialog.getSaveFileName(
            self,
            "Save Download",
            str(Path.home() / suggested_name),
            file_filter,
        )
        if not target_path:
            download.cancel()
            return
        download.setDownloadDirectory(str(Path(target_path).parent))
        download.setDownloadFileName(Path(target_path).name)
        download.accept()
        self.statusBar().showMessage(f"Downloading to {target_path}")

    def closeEvent(self, event):
        try:
            request = Request(f"{APP_URL}/api/shutdown", method="POST")
            urlopen(request, timeout=1)
        except Exception:
            pass
        event.accept()


def launch_server():
    start_server(host=APP_HOST, port=APP_PORT, open_browser=False)


def main():
    qt_app = QApplication(sys.argv)
    qt_app.setApplicationName(APP_TITLE)
    qt_app.setOrganizationName("deutschmark")

    server_thread = threading.Thread(target=launch_server, daemon=True)
    server_thread.start()

    window = DesktopWindow()
    window.show()

    if wait_for_server():
        window.load_app()
    else:
        QMessageBox.critical(
            window,
            "Startup Failed",
            "The local app server did not start in time. Check the console output for details.",
        )
        return 1

    return qt_app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
