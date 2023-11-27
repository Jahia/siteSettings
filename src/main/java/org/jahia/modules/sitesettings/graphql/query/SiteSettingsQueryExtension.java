package org.jahia.modules.sitesettings.graphql.query;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;
import org.jahia.modules.sitesettings.graphql.query.impl.GqlSiteSettingsQuery;

@GraphQLTypeExtension(DXGraphQLProvider.Query.class)
public class SiteSettingsQueryExtension {

    @GraphQLField
    @GraphQLName("siteSettings")
    @GraphQLDescription("Entry point for siteSettings queries")
    public static GqlSiteSettingsQuery getCloud() {
        return new GqlSiteSettingsQuery();
    }
}
