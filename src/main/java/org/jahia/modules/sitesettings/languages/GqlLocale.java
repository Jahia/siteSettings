package org.jahia.modules.sitesettings.languages;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import org.jahia.utils.LanguageCodeConverters;

import java.util.Locale;

public class GqlLocale {
    private final String language;

    public GqlLocale(String language) {
        this.language = language;
    }

    @GraphQLField
    @GraphQLDescription("Language code")
    public String getLanguage() {
        return language;
    }

    @GraphQLField
    @GraphQLDescription("Display name")
    public String getDisplayName(@GraphQLName("language") @GraphQLDescription("Language") String displayLanguage) {
        Locale locale = LanguageCodeConverters.languageCodeToLocale(language);
        return displayLanguage != null ? locale.getDisplayName(Locale.forLanguageTag(displayLanguage)) : locale.getDisplayName(locale);
    }
}
