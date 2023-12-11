package org.jahia.modules.sitesettings.graphql.mutation.impl.htmlFiltering;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import org.jahia.modules.graphql.provider.dxm.DataFetchingException;
import org.jahia.services.content.JCRCallback;
import org.jahia.services.content.JCRNodeWrapper;
import org.jahia.services.content.JCRSessionWrapper;
import org.jahia.services.content.JCRTemplate;

import javax.jcr.RepositoryException;
import java.util.List;
import java.util.stream.Collectors;

@GraphQLName("HtmlFilteringMutation")
@GraphQLDescription("Mutation to manipulate html filtering settings on a site")
public class GqlHtmlFilteringMutation {

    @GraphQLField
    @GraphQLName("updateTags")
    @GraphQLDescription("Update list of filtered tags for the site")
    public Boolean getUpdateTags(@GraphQLNonNull @GraphQLName("siteKey") @GraphQLDescription("Site key for the affected site") String siteKey, @GraphQLName("tags") @GraphQLDescription("Updated list of tags, supply null to remove all tags.") List<String> tags) {

        try {
            return JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Boolean>() {
                @Override
                public Boolean doInJCR(JCRSessionWrapper session) throws RepositoryException {
                    JCRNodeWrapper siteNode = session.getNode("/sites/" + siteKey);
                    String t = tags == null ? "" : String.join(",", tags);
                    siteNode.setProperty("j:filteredTags", t);
                    session.save();

                    return true;
                }
            });
        } catch (RepositoryException e) {
            throw new DataFetchingException(e);
        }
    }

    @GraphQLField
    @GraphQLName("enableFiltering")
    @GraphQLDescription("Enables html filtering on site")
    public Boolean getEnableFiltering(@GraphQLNonNull @GraphQLName("siteKey") String siteKey) {

        try {
            return JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Boolean>() {
                @Override
                public Boolean doInJCR(JCRSessionWrapper session) throws RepositoryException {
                    JCRNodeWrapper siteNode = session.getNode("/sites/" + siteKey);
                    siteNode.setProperty("j:doTagFiltering", true);
                    session.save();

                    return true;
                }
            });
        } catch (RepositoryException e) {
            throw new DataFetchingException(e);
        }
    }

    @GraphQLField
    @GraphQLName("disableFiltering")
    @GraphQLDescription("Disables html filtering on site")
    public Boolean getDisableFiltering(@GraphQLNonNull @GraphQLName("siteKey") String siteKey) {

        try {
            return JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<Boolean>() {
                @Override
                public Boolean doInJCR(JCRSessionWrapper session) throws RepositoryException {
                    JCRNodeWrapper siteNode = session.getNode("/sites/" + siteKey);
                    siteNode.setProperty("j:doTagFiltering", false);
                    session.save();

                    return true;
                }
            });
        } catch (RepositoryException e) {
            throw new DataFetchingException(e);
        }
    }
}
