import React from 'react';
import {LayoutContent} from '@jahia/moonstone';
import {useQuery} from '@apollo/client';
import {SITE_INFO_QUERY} from './SiteProperties.gql-queries';
import {shallowEqual, useSelector} from 'react-redux';
import Header from './Header';
import Content from './Content';

export const SiteProperties = () => {
    const {site, language, uilang} = useSelector(state => ({
        site: state.site,
        language: state.language,
        uilang: state.uilang
    }), shallowEqual);

    const {data, loading, error} = useQuery(SITE_INFO_QUERY, {
        variables: {
            path: `/sites/${site}`,
            displayLanguage: language
        },
        skip: !site
    });

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    console.log(data);

    const edit = () => {
        if (window.CE_API?.edit) {
            window.CE_API.edit({uuid: data?.default?.result?.uuid, site: site, lang: language, uilang: uilang});
        }
    };

    return (
        <LayoutContent isLoading={loading}
                       header={<Header siteDisplayName={data?.default?.result?.site?.displayName} edit={edit}/>}
                       content={<Content site={data?.default?.result?.site} language={language}/>}
        />
    );
};
