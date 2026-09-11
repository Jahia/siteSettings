---
siteSettings: patch
---

Restricted bulk user import so a CSV column can only set a user's profile properties.

A column whose name the product reserves, such as the account's locked state or the provider a user comes from, is left out of the import and listed on the results screen. Columns of your own naming are still imported. If your import file sets a reserved property, set it through the Manage Users screens or the administration API instead.
