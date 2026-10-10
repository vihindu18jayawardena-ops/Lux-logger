# LuxLog

A simple lux survey website. No login is needed, and it works on Android, iPhone, Windows and Mac. Once opened, it also works offline.

## How to use
1. Type the site name once, e.g. "Base Hospital Panadura". It tells the app the building type.
2. For each point, type the **Location** (e.g. "Ward 3 – bed 2", "OPD room 1", "Main corridor") and the **Measured lux**, then tap **Add reading**.
3. The app finds the area type and its recommended range from JIS Z9110-2010. It rates each reading **Low** (below the range), **Good** (within) or **High** (above). If JIS Z9110 has no matching area (e.g. production floor, car park, loading bay), the OSHA 29 CFR 1926.56 minimum is used instead (Low below the minimum, Good at or above). If a location name isn't recognised at all, choose its area once; the app remembers it.
4. Tap ✕ to delete a reading (with Undo), or use **Delete all readings**.
5. The **Report** tab updates automatically. **Excel report** and **Word report** download finished files with graphs and the rating table.

## Data
Readings are saved on the device only. Use **Download backup** (Report tab) to keep a copy or move surveys to another device, then **Load backup** there.

## Updating the website on GitHub
Upload all files and the `lib` folder to the repository (Add file → Upload files), replacing the old ones. The site updates within 1–2 minutes.
