package org.jahia.modules.sitesettings.languages;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.codehaus.plexus.util.StringUtils;
import org.jahia.modules.graphql.provider.dxm.admin.GqlAdminQuery;
import org.jahia.utils.LanguageCodeConverters;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

@GraphQLTypeExtension(GqlAdminQuery.class)
public class GqlAdminQueryExtension {
    private GqlAdminQueryExtension() {
    }

    @GraphQLField
    @GraphQLDescription("List all available locales in the JVM")
    public static Set<GqlLocale> getAvailableLocales(@GraphQLName("language") @GraphQLNonNull String language) {
        return LanguageCodeConverters.getSortedLocaleList(LanguageCodeConverters.languageCodeToLocale(language)).stream()
                .filter(l -> StringUtils.isNotBlank(l.toString()))
                .map(GqlLocale::new)
                .sorted(Comparator.comparing(l -> l.getDisplayName(language)))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
