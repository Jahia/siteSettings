import gql from 'graphql-tag';
import {PredefinedFragments} from '@jahia/data-helper';

export const SITE_INFO_QUERY = gql`
    query siteInfo($path: String!, $displayLanguage:String!) {
        live: jcr(workspace: LIVE) {
            result:nodeByPath(path: $path) {
                site {
                    ...SiteInfo
                    ...NodeCacheRequiredFields
                }
                ...NodeCacheRequiredFields
            }
        }
        default: jcr {
            result:nodeByPath(path: $path) {
                site {
                    ...SiteInfo
                    ...NodeCacheRequiredFields
                }
                ...NodeCacheRequiredFields
            }
        }
    }
    fragment SiteInfo on JCRSite {
        name
        displayName(language: $displayLanguage)
        defaultLanguage
        serverName
        description
        templateSet:property(name:"j:templatesSet") {
          value
        }
        created:property(name:"jcr:created") {
          value
        }
        additionalServerNames:property(name:"j:serverNameAliases") {
          values
        }
        languages {
          displayName
          mandatory
          language
        }
    }
    ${PredefinedFragments.nodeCacheRequiredFields.gql}
`;
