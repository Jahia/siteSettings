package org.jahia.modules.sitesettings.graphql.query.impl.htmlFiltering;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import org.jahia.modules.graphql.provider.dxm.DataFetchingException;
import org.jahia.modules.sitesettings.graphql.models.GqlHTMLFiltering;
import org.jahia.services.content.JCRCallback;
import org.jahia.services.content.JCRNodeWrapper;
import org.jahia.services.content.JCRSessionWrapper;
import org.jahia.services.content.JCRTemplate;

import javax.jcr.RepositoryException;

@GraphQLName("HTMLFilteringQuery")
@GraphQLDescription("Query for html filtering settings")
public class GqlHtmlFilteringQuery {

    @GraphQLField
    @GraphQLName("filteringSettings")
    @GraphQLDescription("HTML filtering settings for a site")
    public GqlHTMLFiltering getFilteringSettings(@GraphQLNonNull @GraphQLName("siteKey") @GraphQLDescription("Site key for the affected site") String siteKey) {
        GqlHTMLFiltering filtering = null;

        try {
            filtering = JCRTemplate.getInstance().doExecuteWithSystemSession(new JCRCallback<GqlHTMLFiltering>() {

                @Override
                public GqlHTMLFiltering doInJCR(JCRSessionWrapper session) throws RepositoryException {
                    JCRNodeWrapper siteNode = session.getNode("/sites/" + siteKey);
                    boolean enabled = siteNode.hasProperty("j:doTagFiltering") && siteNode.getProperty("j:doTagFiltering").getBoolean();

                    return new GqlHTMLFiltering(siteKey, enabled);
                }
            });
        } catch (RepositoryException e) {
            throw new DataFetchingException(e);
        }

        return filtering;
    }
}
