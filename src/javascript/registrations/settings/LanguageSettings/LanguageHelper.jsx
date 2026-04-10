export const buildLanguageVariables = (path, locales) => ({
    path,
    languages: locales.filter(l => l.activeInEdit || l.activeInLive || l.defaultLanguage || l.mandatory).map(l => l.language),
    mandatoryLanguages: locales.filter(l => l.mandatory).map(l => l.language),
    inactiveLanguages: locales.filter(l => !l.activeInEdit).map(l => l.language),
    inactiveLiveLanguages: locales.filter(l => !l.activeInLive).map(l => l.language)
});

export const getAvailability = ({activeInEdit, activeInLive, mandatory}) => {
    if (activeInEdit && activeInLive && mandatory) {
        return 'required';
    }

    if (activeInEdit && activeInLive) {
        return 'active';
    }

    if (activeInEdit) {
        return 'inactiveInLive';
    }

    return 'inactive';
};
