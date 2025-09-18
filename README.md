# integ

Integration application with GitHub text styling and app publishing pipeline.

## Features

### Text Styling
- **GitHub Text Coloring**: Automatically highlights "GitHub" mentions in cyan/blue
- **Yellow Text Support**: Supports yellow text styling for enhanced readability
- **Combined Styling**: Supports combining GitHub coloring with yellow text

### App Publishing Pipeline
- **SDK Version Compatibility**: Supports backward compatibility with SDK versions 1.0.0 - 2.9.9
- **Automated Publishing**: GitHub Actions workflow for app publishing
- **Build Integration**: Automated build and test processes

## Usage

### Running the Demo
```bash
npm install
node index.js
```

### GitHub Text Styling Examples
The application will automatically style:
- "GitHub" mentions with colored highlighting
- Support for yellow text display
- Combined styling for enhanced visual appeal

### Publishing Pipeline
The GitHub Actions workflow automatically:
1. Checks SDK version compatibility (now supports older versions)
2. Builds the application
3. Publishes to the app store

## SDK Version Support
- **Previous versions**: Now supported (1.0.0+)
- **Current version**: 1.5.0 (working)
- **Future versions**: Supported up to 2.9.9