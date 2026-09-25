# siteSettings Changelog

## 0.1.0

### New Features

* New React UI for language site settings (#190)

### Bug Fixes

* Escape the path argument of the site languages count query so the count stays scoped to the requested path

* Fixed display of page paths containing special characters in the Page Models administration screen.

* Bound the Manage Groups listings and lookups to the principal realm of the container the screen is reached through

* Site-scoped administrators only manage principals within their site

* Restricted bulk user import so a CSV column can only set a user's profile properties.

  A column whose name the product reserves, such as the account's locked state or the provider a user comes from, is left out of the import and named on screen. Columns of your own naming are still imported, unless their name starts with `j:` or `jcr:`. Set a user's locked state from the Manage Users screens, and the properties that tie a user to an external provider from that provider's own configuration.

* Escape the member display name in the Manage Groups edit view (Material theme) so it matches the escaping already applied in the standard theme.

* Restricted the Manage Groups member candidate list to the principal store of the site being administered.

* Aligned the Manage Users and Manage Groups administration screens with the principal realm of the container they are reached through: the server-wide realm on the global settings node, a single site's realm on a site node. Held by any other container, these screens list no principal and apply no change.

* Fixed display of page model names and titles containing special characters in the Page Models administration screen.

* Enforce administered-site scope in the Manage Groups create/copy/remove-members operations

* Fixed display of user names containing special characters in the Manage Users administration screens (user list and bulk-delete views).

* Remove static assets usages (#198)

* Prevent hard crash on `settings/languages` admin user interface. (#250)

* Changed the site settings screens so they are displayed only from within a module.

* Consistently escape special characters in the Manage Users flow messages

* Tag the style elements this module injects with `styleloader`, so that jContent below 3.7 copies the Moonstone stylesheet into the Page Builder frame (Jahia/jcontent#2786).

* Consistently escape the page-model path wherever it appears on the Page Models screen
