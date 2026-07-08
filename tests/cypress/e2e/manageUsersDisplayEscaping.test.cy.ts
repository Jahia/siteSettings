// Regression test: user display names containing special characters must render as inert TEXT in
// the Manage Users administration screen (they must not become live DOM/HTML). Opaque by design.
// Fully self-contained (CI-ready): creates its own site + a SITE user (via a groovy fixture whose
// jcr:title carries markup) in before(), tears the site down in after(). Data setup lives in the
// cypress framework; the UI part only asserts what is rendered.
import {createSite, deleteSite} from '@jahia/cypress';

describe('Manage Users - display name rendering', () => {
    const SITE = 'manageUsersEscapingSite';
    const USER = 'displaynameuser';
    const PAYLOAD = '<img src=x onerror=window.__sec064fired=1>';

    before(() => {
        createSite(SITE, {
            languages: 'en',
            templateSet: 'templates-system',
            serverName: 'localhost',
            locale: 'en',
        });
        cy.executeGroovy('groovy/createSiteUserWithTitle.groovy', {
            USER_NAME: USER,
            SITE_KEY: SITE,
            PASSWORD: 'DisplayNamePass123!',
            TITLE_VALUE: PAYLOAD,
        }).then((raw) => {
            if (String(raw ?? '').includes('.failed')) {
                throw new Error(`createSiteUserWithTitle failed: ${raw}`);
            }
        });
    });

    after(() => {
        deleteSite(SITE);
    });

    it('renders a display name containing markup as literal text (no active element, no handler fires)', () => {
        cy.login();
        cy.visit(`/cms/editframe/default/en/sites/${SITE}.manageUsers.html`, {
            onBeforeLoad(win) {
                // @ts-ignore
                win.__sec064fired = undefined;
            },
        });

        // drive the real search form to list our user
        cy.get('#searchString').clear().type(USER);
        cy.get('[name="_eventId_search"]').first().click();

        // the display name must appear as escaped literal text in a table cell
        cy.contains('td', PAYLOAD, {timeout: 10000}).should('be.visible');
        // and must NOT have become a live <img> element carrying an onerror handler
        cy.get('td img[onerror]').should('not.exist');

        // definitive live check: the onerror handler must never have executed
        cy.wait(1500);
        cy.window().then((win) => {
            // @ts-ignore
            expect(win.__sec064fired, 'the onerror handler must not fire').to.be.undefined;
        });
    });
});
