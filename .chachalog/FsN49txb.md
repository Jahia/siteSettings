---
siteSettings: patch
---

Restricted bulk user import so a CSV column can only set a user's profile properties.

A column whose name the product reserves, such as the account's locked state or the provider a user comes from, is left out of the import and named on screen. Columns of your own naming are still imported, unless their name starts with `j:` or `jcr:`. Set a user's locked state from the Manage Users screens, and the properties that tie a user to an external provider from that provider's own configuration.
