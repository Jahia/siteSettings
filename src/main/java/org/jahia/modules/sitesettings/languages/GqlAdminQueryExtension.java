package org.jahia.modules.sitesettings.languages;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.apache.commons.lang.StringUtils;
import org.jahia.modules.graphql.provider.dxm.admin.GqlAdminQuery;
import org.jahia.utils.LanguageCodeConverters;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@GraphQLTypeExtension(GqlAdminQuery.class)
public class GqlAdminQueryExtension {
    private static final Logger logger = LoggerFactory.getLogger(GqlAdminQueryExtension.class.getName());

    private GqlAdminQueryExtension() {
    }

    @GraphQLField
    @GraphQLDescription("List all available locales in the JVM")
    public static Set<GqlLocale> getAvailableLocales(@GraphQLName("language") @GraphQLNonNull String language) {
        Locale locale = LanguageCodeConverters.languageCodeToLocale(language);
        if (locale == null) {
            logger.error("Invalid language: {}", language);
            return Collections.emptySet();
        }
        return LanguageCodeConverters.getSortedLocaleList(locale).stream()
                .filter(l -> StringUtils.isNotBlank(l.toString()))
                .map(l -> new GqlLocale(l.toString()))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
