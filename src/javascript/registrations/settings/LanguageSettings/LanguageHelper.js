/**
 * Build GraphQL variables for language settings
 * @param path site path is mandatory
 * @param locales languages set for the site specified
 * @returns {{path: *, languages: *, mandatoryLanguages: *, inactiveLanguages: *, inactiveLiveLanguages: *}}
 */
export const buildLanguageVariables = (path, locales) => ({
    path,
    languages: locales.filter(l => l.activeInEdit || l.activeInLive || l.mandatory).map(l => l.language),
    mandatoryLanguages: locales.filter(l => l.mandatory).map(l => l.language),
    inactiveLanguages: locales.filter(l => !l.activeInEdit).map(l => l.language),
    inactiveLiveLanguages: locales.filter(l => !l.activeInLive).map(l => l.language)
});

/**
 * Get the availability label depending on site configuration:
 * <ul>
 *   <li>language is required when activeInEdit: true and activeInLive: true and mandatory: true</li>
 *   <li>language is active when activeInEdit: true and activeInLive: true and mandatory: false</li>
 *   <li>language is inactiveInLive when activeInEdit: true and activeInLive: false and mandatory: false</li>
 *   <li>otherwise language is inactive</li>
 * </ul>
 * <note>activeInEdit: true and activeInLive: false never happens because of the UI constraints</note>
 * @param param0 site language configuration
 * @param param0.activeInEdit language is active in edit mode
 * @param param0.activeInLive language is active in live mode
 * @param param0.mandatory language is mandatory
 * @returns {string} availability label
 */
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

export const emptyLanguage = Object.freeze({
    isNew: true,
    activeInEdit: false,
    activeInLive: false,
    mandatory: false
});
