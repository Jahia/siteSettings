package org.jahia.modules.sitesettings.languages;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import org.jahia.modules.graphql.provider.dxm.site.GqlSiteLanguage;

import java.util.Locale;

public class GqlLocale extends GqlSiteLanguage {
    private final Locale locale;
    private final long count;

    public GqlLocale(Locale locale) {
        this(locale, false, false, false, 0L);
    }

    public GqlLocale(Locale locale, boolean activeInEdit, boolean activeInLive, boolean mandatory, long count) {
        super(locale.toString(), activeInEdit, activeInLive, mandatory);
        this.locale = locale;
        this.count = count;
    }

    @GraphQLField
    @GraphQLDescription("Count locale usage")
    public long getCount() {
        return count;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        GqlLocale gqlLocale = (GqlLocale) o;
        return locale.equals(gqlLocale.locale);
    }

    @Override
    public int hashCode() {
        return locale.hashCode();
    }
}
