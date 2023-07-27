import {
    BasePage,
    Button,
    Collapsible,
    getComponentByAttr,
    getComponentByRole,
    getComponentBySelector,
    Menu,
} from '@jahia/cypress'
import { ComponentType } from '@jahia/cypress/src/page-object/baseComponent'
import { Field, SmallTextField } from './fields'

export class ContentEditor extends BasePage {
    static defaultSelector = '[aria-labelledby="dialog-content-editor"]'

    static getContentEditor(): ContentEditor {
        return getComponentBySelector(ContentEditor, ContentEditor.defaultSelector)
    }

    save() {
        getComponentByRole(Button, 'submitSave').click()
        cy.get('#dialog-errorBeforeSave', { timeout: 1000 }).should('not.exist')
        cy.get('[role="alertdialog"]').should('be.visible').should('contain', 'Content successfully saved')
    }

    saveUnchecked() {
        getComponentByRole(Button, 'createButton').click()
    }

    editSavedContent() {
        cy.get('[role="alertdialog"]').should('be.visible').find('.moonstone-button').click()
    }

    cancel() {
        getComponentByRole(Button, 'backButton').click()
    }

    cancelAndDiscard() {
        getComponentByRole(Button, 'backButton').click()
        getComponentByRole(Button, 'close-dialog-discard').click()
    }

    switchToAdvancedMode() {
        getComponentByRole(Button, 'advancedMode').should('be.visible').click()
    }

    getSmallTextField(fieldName: string, multiple?: boolean): SmallTextField {
        return this.getField(SmallTextField, fieldName, multiple)
    }

    getField<FieldType extends Field>(
        FieldComponent: ComponentType<FieldType>,
        fieldName: string,
        multiple?: boolean,
    ): FieldType {
        const r = getComponentByAttr(FieldComponent, 'data-sel-content-editor-field', fieldName)
        r.fieldName = fieldName
        r.multiple = multiple
        return r
    }
}
