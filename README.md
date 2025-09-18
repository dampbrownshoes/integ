# integ

Integration testing repository for app publishing pipeline.

## Recent Changes

### Fixed App Publishing Pipeline Issue

**Issue**: Apps using previous SDK versions (2.0.x) were being automatically dropped from the publishing pipeline due to overly restrictive version checking.

**Solution**: Reverted the strict version check to allow apps using SDK version 2.0.x and above:
- Minimum required SDK version: `2.0.0` (previously `2.1.0`)
- Apps using older SDK versions (2.0.x) now show a warning but are still published
- Apps using very old SDK versions (below 2.0.0) are still appropriately blocked

### Repository Information

This repository is hosted on <span style="color: #0366d6; font-weight: bold;">**GitHub**</span> and uses <span style="color: #0366d6; font-weight: bold;">**GitHub**</span> Actions for continuous integration. The workflow file is configured to trigger on pushes to the main branch and pull requests.

The <span style="color: #0366d6; font-weight: bold;">**GitHub**</span> Actions pipeline includes:
- SDK version checking
- App validation
- Publishing workflow

### Testing

Run the publishing pipeline:
```bash
npm run validate && npm run check-version && npm run publish
```

Run tests:
```bash
npm test
```

### Contributing

When contributing to this repository on <span style="color: #0366d6; font-weight: bold;">**GitHub**</span>, please:
1. Create a feature branch
2. Make your changes
3. Submit a pull request via <span style="color: #0366d6; font-weight: bold;">**GitHub**</span>
4. Ensure all <span style="color: #0366d6; font-weight: bold;">**GitHub**</span> Actions checks pass