import React, {useEffect, useState} from 'react';
import {shallowEqual, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {useQuery} from '@apollo/client';
import {Add, Button, Header, LayoutContent} from '@jahia/moonstone';
import {useNodeChecks} from '@jahia/data-helper';
import {LanguageContent} from './LanguageContent';
import {UntranslatedContent} from './UntranslatedContent';
import {LanguageModal} from './LanguageModal';
import * as LanguageGraphQL from './Language.graphql';

export const LanguageSettings = () => {
    const {t} = useTranslation('siteSettings');
    const {site, uilang} = useSelector(state => ({site: state.site, uilang: state.uilang}), shallowEqual);
    const res = useNodeChecks({path: `/sites/${site}`, uilang}, {requiredPermission: 'siteAdminLanguages'});

    const {data, loading, error, refetch} = useQuery(LanguageGraphQL.gqlGetSiteLanguages, {
        variables: {
            path: `/sites/${site}`,
            displayLanguage: uilang
        },
        skip: !site
    });

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    const [siteLocales, setSiteLocales] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState({
        isNew: true,
        activeInEdit: false,
        activeInLive: false,
        mandatory: false
    });
    const [modalOpen, setModalOpen] = useState(false);

    const allowsUnlistedLanguages = data?.jcr?.result?.site?.allowsUnlistedLanguages?.booleanValue;
    const mixLanguage = data?.jcr?.result?.site?.mixLanguage?.booleanValue;
    const defaultLanguage = data?.jcr?.result?.site?.defaultLanguage;
    useEffect(() => setSiteLocales(data?.jcr?.result?.site?.languages || []), [data]);

    const openModal = language => {
        setSelectedLanguage({...language, isNew: !language.language});
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    if (!res.checksResult) {
        return '';
    }

    return (
        <LayoutContent isLoading={loading}
                       aria-labelledby="language-settings"
                       header={
                           <Header mainActions={[
                               <Button key="addLanguage"
                                       size="big"
                                       color="accent"
                                       icon={<Add/>}
                                       label={t('label.table.actions.add')}
                                       data-sel-role="addLanguage"
                                       onClick={() => openModal({
                                           isNew: true,
                                           activeInEdit: false,
                                           activeInLive: false,
                                           mandatory: false
                                       })}/>
                           ]}
                                   title={t('label.header', {siteName: data?.jcr?.result?.site?.displayName})}/>
                       }
                       content={
                           <>
                               <LanguageModal site={site}
                                              selectedLanguage={selectedLanguage}
                                              setSelectedLanguage={setSelectedLanguage}
                                              isOpen={modalOpen}
                                              closeModal={closeModal}
                                              refetch={refetch}
                                              availableLocales={data?.admin?.availableLocales}
                                              siteLocales={siteLocales}
                                              defaultLanguage={defaultLanguage}/>
                               <LanguageContent site={site}
                                                uilang={uilang}
                                                openModal={openModal}
                                                siteLocales={siteLocales}
                                                defaultLanguage={defaultLanguage}
                                                refetch={refetch}/>
                               <UntranslatedContent site={site}
                                                    value={allowsUnlistedLanguages && mixLanguage ? 'all' :
                                                        mixLanguage ? 'only' : 'never'}
                                                    refetch={refetch}/>
                           </>
                       }/>
    );
};
