package org.jahia.modules.sitesettings.graphql.models;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;

import java.util.List;

@GraphQLDescription("Model for HTML filter settings of a site")
public class GqlHTMLFiltering {

    private String siteKey;
    private List<String> tags;
    private boolean filteringEnabled;

    public GqlHTMLFiltering(String siteKey, List<String> tags, boolean filteringEnabled) {
        this.siteKey = siteKey;
        this.tags = tags;
        this.filteringEnabled = filteringEnabled;
    }

    @GraphQLField
    @GraphQLName("siteKey")
    @GraphQLDescription("Site key")
    public String getSiteKey() {
        return siteKey;
    }

    @GraphQLField
    @GraphQLName("tags")
    @GraphQLDescription("List of filter tags")
    public List<String> getTags() {
        return tags;
    }

    @GraphQLField
    @GraphQLName("filteringEnabled")
    @GraphQLDescription("Indicates if html filtering is enabled or not")
    public Boolean getFilteringEnabled() {
        return filteringEnabled;
    }
}
