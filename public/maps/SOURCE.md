# Iran province boundaries

`iran-provinces.geojson` contains all 31 Iranian province boundaries extracted
from the **Natural Earth 1:10m Admin-1 — States and Provinces** dataset,
version 5.1.1.

- Source: https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/
- Dataset: `ne_10m_admin_1_states_provinces`
- Filter: `adm0_a3 == "IRN"`
- License: Natural Earth data is in the public domain.

The features were converted from Shapefile to GeoJSON. Properties were reduced
to Persian and English province names plus the ISO subdivision code. Two English
names were normalized to match the application's existing data keys:

- `Chaharmahal and Bakhtiari` → `Chaharmahal and Bakhtiyari`
- `Kohgiluyeh and Boyer-Ahmad` → `Kohgiluye and Buyer Ahmad`
