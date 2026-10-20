# Cypress tests

## Tags

A spec migrated from a legacy Selenium class tags each of its tests with `context.tag(...)` from
`@jahia/cypress`, using the tags of its row in the tracking issue of the migration on
`Jahia/selenium`. The `testrail-case-<n>` tag is what lets the reporter close the legacy TestRail
case against its Cypress replacement.

A spec written directly in Cypress answers for no legacy case, so it stays untagged. The suite is
therefore part tagged and part not, and that is intended: do not tag the other specs to make it
uniform.
