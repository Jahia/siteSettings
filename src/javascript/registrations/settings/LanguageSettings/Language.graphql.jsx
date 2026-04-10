import gql from 'graphql-tag';
import {PredefinedFragments} from '@jahia/data-helper';

export const gqlGetSiteLanguages = gql`query getSiteLanguages($path: String!, $displayLanguage: String!) {
        jcr(workspace: EDIT) {
            result: nodeByPath(path: $path) {
                site {
                    name
                    displayName(language: $displayLanguage)
                    defaultLanguage                    
                    mixLanguage: property(name: "j:mixLanguage") { booleanValue }
                    allowsUnlistedLanguages: property(name: "j:allowsUnlistedLanguages") { booleanValue }
                    languages {
                        language
                        displayName(language: $displayLanguage)
                        mandatory
                        activeInEdit
                        activeInLive
                        count(path: $path)
                    }
                    ...NodeCacheRequiredFields
                }
                ...NodeCacheRequiredFields
            }
        }
        admin {
            availableLocales(language: $displayLanguage) {
                displayName(language: $displayLanguage)
                language
            }
        }
    }
    ${PredefinedFragments.nodeCacheRequiredFields.gql}`;

export const gqlSetDefaultLanguage = gql`mutation setSiteDefaultLanguage($path: String!, $defaultLanguage: String!) {
    jcr(workspace: EDIT) {
        mutateNode(pathOrId: $path) {
            defaultLanguage: mutateProperty(name: "j:defaultLanguage") {
                setValue(value: $defaultLanguage, type: STRING)
            }
        }
    }
}`;

export const gqlSave = gql`mutation deleteSiteLanguage($path: String!, $languages: [String!]!, $mandatoryLanguages: [String!]!, $inactiveLanguages: [String!]!, $inactiveLiveLanguages: [String!]!) {
    jcr {
        mutateNode(pathOrId: $path) {
            languages: mutateProperty(name: "j:languages") {
                setValues(values: $languages, type: STRING)
            }
            mandatoryLanguages: mutateProperty(name: "j:mandatoryLanguages") {
                setValues(values: $mandatoryLanguages, type: STRING)
            }
            inactiveLanguages: mutateProperty(name: "j:inactiveLanguages") {
                setValues(values: $inactiveLanguages, type: STRING)
            }
            inactiveLiveLanguages: mutateProperty(name: "j:inactiveLiveLanguages") {
                setValues(values: $inactiveLiveLanguages, type: STRING)
            }
        }
    }
}`;
