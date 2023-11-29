package org.jahia.modules.sitesettings.graphql.mutation.impl;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.sitesettings.graphql.mutation.impl.htmlFiltering.GqlHtmlFilteringMutation;

@GraphQLName("SiteSettingsMutation")
public class GqlSiteSettingsMutation {

    @GraphQLField
    @GraphQLName("htmlFiltering")
    @GraphQLDescription("HTML filtering mutation")
    public GqlHtmlFilteringMutation getHtmlFiltering() {
        return new GqlHtmlFilteringMutation();
    }
}
