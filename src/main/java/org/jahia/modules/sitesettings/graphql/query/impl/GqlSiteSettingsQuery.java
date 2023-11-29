package org.jahia.modules.sitesettings.graphql.query.impl;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.modules.sitesettings.graphql.query.impl.htmlFiltering.GqlHtmlFilteringQuery;

@GraphQLName("SiteSettingsQuery")
public class GqlSiteSettingsQuery {

    @GraphQLField
    @GraphQLName("htmlFiltering")
    @GraphQLDescription("HTML filtering settings queries")
    public GqlHtmlFilteringQuery getHtmlFiltering() {
        return new GqlHtmlFilteringQuery();
    }
}
