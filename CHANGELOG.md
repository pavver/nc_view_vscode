# Change Log

All notable changes to the "nc-view" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how
to structure this file.

## [Unreleased]

## [0.0.6] - 2025-09-28

### Added
- **Anti-aliasing:** anti-aliasing doesn't work very well, but it still seems better with it than without it.
- **Using editor theme colors:** Colors from the vs code theme are used, colors are automatically reloaded when changing the theme.
- **Ignoring commented lines:** Added ignoring commented code lines.
- **Start and end point markers:** Added markers for the start and end of the selected line segment. The markers scale with zoom to improve visibility.

### Fixed
- **Zoom:** Now the zoom center is on the cursor, not in the center of the screen. Much more convenient.
- **Camera:** The camera no longer moves after editing a file.

## [0.0.5] - 2025-09-27

### Added
- **Keyboard Shortcut:** Added the standard `Ctrl+K V` keyboard shortcut to launch the viewer for a more native preview experience.

### Changed
- **UX/UI Overhaul:** Replaced all context menu entries with a single "Open Preview" icon in the editor title bar for a cleaner, more integrated UI.
- **Documentation:** The `README.md` file has been completely rewritten to reflect all new features and usage instructions.

### Fixed
- **Arc Rendering:** Fixed a critical bug in the arc rendering logic (`G2`/`G3`) that caused incorrect display or complete omission of circular toolpaths.
- **Cold Start Bug:** Resolved a race condition that caused the viewer to appear empty on its first launch in a new VS Code session.
- **File Opening:** Fixed a bug where the viewer would fail to open when launched from an editor tab.

## [0.0.4]

### Added

- v 0.0.4 - Add support uppercase file extensions and exclude codes setting