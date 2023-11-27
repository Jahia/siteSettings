package org.jahia.modules.sitesettings.graphql.mutation;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;
import org.jahia.modules.sitesettings.graphql.mutation.impl.GqlSiteSettingsMutation;

@GraphQLTypeExtension(DXGraphQLProvider.Mutation.class)
public class SiteSettingsMutationExtension {

    @GraphQLField
    @GraphQLName("siteSettings")
    @GraphQLDescription("Entry point for site settings mutations")
    public static GqlSiteSettingsMutation getCloud() {
        return new GqlSiteSettingsMutation();
    }
}
