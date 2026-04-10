package org.jahia.modules.sitesettings.languages;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.api.Constants;
import org.jahia.api.content.JCRTemplate;
import org.jahia.modules.graphql.provider.dxm.site.GqlSiteLanguage;
import org.jahia.osgi.BundleUtils;
import org.jahia.services.content.JCRContentUtils;

import javax.jcr.RepositoryException;
import javax.jcr.query.Query;

@GraphQLTypeExtension(GqlSiteLanguage.class)
public class GqlSiteLanguageExtension {
    private final GqlSiteLanguage gqlSiteLanguage;
    private final Long count;

    public GqlSiteLanguageExtension(GqlSiteLanguage gqlSiteLanguage) {
        this.gqlSiteLanguage = gqlSiteLanguage;
        count = null;
    }

    @GraphQLField
    @GraphQLDescription("Count languages usage")
    public long count(@GraphQLName("path") @GraphQLNonNull String path) throws RepositoryException {
        if (count != null) {
            return count;
        }
        return BundleUtils.getOsgiService(JCRTemplate.class, null).doExecuteWithSystemSessionAsUser(null, Constants.EDIT_WORKSPACE, null, session ->
                session.getWorkspace().getQueryManager()
                        .createQuery("SELECT count AS [rep:count(skipChecks=1)] FROM [jnt:translation]" +
                                        " WHERE ISDESCENDANTNODE(['" + path + "'])" +
                                        " AND [jcr:language] = '" + JCRContentUtils.sqlEncode(gqlSiteLanguage.getLanguage()) + "'",
                                Query.JCR_SQL2)
                        .execute().getRows().nextRow().getValue("count").getLong());
    }
}
