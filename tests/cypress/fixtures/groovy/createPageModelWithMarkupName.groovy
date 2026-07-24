import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.content.JCRNodeWrapper
import org.jahia.api.Constants
import javax.jcr.RepositoryException
import java.util.Locale

// Plant a template-model page (jnt:page + jmix:canBeUseAsTemplateModel) under the site whose NODE
// NAME contains reserved markup characters. That node name flows verbatim into the "page path" column
// of the Page Models administration screen. A node name set through addChild is sanitised, whereas a
// JCR rename() is not; the fixture reproduces that by creating with a plain name then rename()-ing to
// the raw markup name.
//
// Runs in the EDIT workspace + EN locale: the screen renders in edit/en and its list query joins the
// EN translation, so the node must carry its mandatory i18n props (jcr:title, j:pageTemplateTitle) in
// EN or it is filtered out of the list. Idempotent. Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSessionAsUser(null, Constants.EDIT_WORKSPACE, Locale.ENGLISH, new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JCRNodeWrapper site = session.getNode("/sites/SITE_KEY")
        String markupName = "MARKUP_NAME"
        if (site.hasNode(markupName)) {
            return null // already planted
        }
        JCRNodeWrapper page = site.addNode("pageModelProbe", "jnt:page")
        page.addMixin("jmix:canBeUseAsTemplateModel")
        page.setProperty("jcr:title", "Page model probe")
        page.setProperty("j:pageTemplateTitle", "Page model probe") // mandatory i18n prop
        page.setProperty("j:templateName", "home")
        session.save()
        page.rename(markupName)
        session.save()
        log.info("createPageModelWithNamePayload: " + page.getPath())
        return null
    }
})
