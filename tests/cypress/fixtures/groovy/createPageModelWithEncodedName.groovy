import org.jahia.services.content.JCRCallback
import org.jahia.services.content.JCRSessionWrapper
import org.jahia.services.content.JCRTemplate
import org.jahia.services.content.JCRNodeWrapper
import org.jahia.api.Constants
import javax.jcr.RepositoryException
import java.util.Base64
import java.util.Locale

// Plant a template-model page (jnt:page + jmix:canBeUseAsTemplateModel) under the site, giving it a node
// NAME supplied base64-encoded so the name can carry any character a JCR name allows. The name is decoded
// here and applied with rename() so it reaches the repository verbatim; that node name is what shows in
// the "page path" column of the Page Models administration screen.
//
// Runs in the EDIT workspace + EN locale: the screen renders in edit/en and its list query joins the EN
// translation, so the node carries its mandatory i18n props (jcr:title, j:pageTemplateTitle) in EN or it
// is filtered out of the list. Idempotent. Tokens replaced by cy.executeGroovy.
JCRTemplate.getInstance().doExecuteWithSystemSessionAsUser(null, Constants.EDIT_WORKSPACE, Locale.ENGLISH, new JCRCallback() {
    @Override
    Object doInJCR(JCRSessionWrapper session) throws RepositoryException {
        JCRNodeWrapper site = session.getNode("/sites/SITE_KEY")
        String markupName = new String(Base64.getDecoder().decode("MARKUP_NAME_B64"), "UTF-8")
        if (site.hasNode(markupName)) {
            return null // already planted
        }
        // truly idempotent: drop a probe left behind by a run that failed between addNode() and rename()
        if (site.hasNode("pageModelProbe")) {
            site.getNode("pageModelProbe").remove()
            session.save()
        }
        JCRNodeWrapper page = site.addNode("pageModelProbe", "jnt:page")
        page.addMixin("jmix:canBeUseAsTemplateModel")
        page.setProperty("jcr:title", "Page model probe")
        page.setProperty("j:pageTemplateTitle", "Page model probe") // mandatory i18n prop
        page.setProperty("j:templateName", "home")
        session.save()
        page.rename(markupName)
        session.save()
        log.info("createPageModelWithEncodedName: " + page.getPath())
        return null
    }
})
