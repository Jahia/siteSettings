import { BasePage, Button, getComponentByRole, getComponentBySelector } from '@jahia/cypress'
import { ContentEditor } from './contentEditor'

export class SiteProperties extends BasePage {
    static defaultSelector = '[aria-labelledby="site-properties"]'

    static visit(siteKey: string): SiteProperties {
        cy.visit(`/jahia/administration/${siteKey}/settings/properties`)
        return getComponentBySelector(SiteProperties, SiteProperties.defaultSelector)
    }

    edit(): ContentEditor {
        getComponentByRole(Button, 'edit-site-properties').click()
        return ContentEditor.getContentEditor()
    }

    editLanguages() {
        getComponentByRole(Button, 'edit-languages').click()
    }
}
