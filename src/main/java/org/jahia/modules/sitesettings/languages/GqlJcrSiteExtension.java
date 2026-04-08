package org.jahia.modules.sitesettings.languages;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.site.GqlJcrSite;
import org.jahia.services.content.JCRContentUtils;
import org.jahia.services.content.decorator.JCRSiteNode;

import javax.jcr.RepositoryException;
import javax.jcr.query.Query;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@GraphQLTypeExtension(GqlJcrSite.class)
public class GqlJcrSiteExtension {
    private final GqlJcrSite gqlJcrSite;

    public GqlJcrSiteExtension(GqlJcrSite gqlJcrSite) {
        this.gqlJcrSite = gqlJcrSite;
    }

    @GraphQLField
    @GraphQLDescription("Count languages usage")
    public Set<GqlLocale> getSiteLocales(@GraphQLName("language") @GraphQLNonNull String language) {
        JCRSiteNode siteNode = (JCRSiteNode) gqlJcrSite.getNode();
        return Stream.concat(
                        siteNode.getLanguagesAsLocales().stream().map(locale -> new GqlLocale(locale, true, siteNode.getActiveLiveLanguages().contains(locale.toString()), siteNode.getMandatoryLanguages().contains(locale.toString()), countLanguages(locale.toString()))),
                        siteNode.getInactiveLanguagesAsLocales().stream().map(locale -> new GqlLocale(locale, false, false, siteNode.getMandatoryLanguages().contains(locale.toString()), countLanguages(locale.toString()))))
                .sorted(Comparator.comparing(l -> l.getDisplayName(language)))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private long countLanguages(String language) {
        try {
            return gqlJcrSite.getNode().getSession().getWorkspace().getQueryManager()
                    .createQuery("SELECT count AS [rep:count(skipChecks=1)] FROM [jnt:translation]" +
                                    " WHERE ISDESCENDANTNODE(['/sites/" + gqlJcrSite.getSiteKey() + "'])" +
                                    " AND [jcr:language] = '" + JCRContentUtils.sqlEncode(language) + "'",
                            Query.JCR_SQL2)
                    .execute().getRows().nextRow().getValue("count").getLong();
        } catch (RepositoryException e) {
            return 0;
        }
    }
}
