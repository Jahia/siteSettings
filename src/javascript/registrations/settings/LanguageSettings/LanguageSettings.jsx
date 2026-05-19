import React, {useState} from 'react';
import {shallowEqual, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {useQuery} from '@apollo/client';
import {Add, Button, Header, LayoutContent} from '@jahia/moonstone';
import {useNodeChecks} from '@jahia/data-helper';
import {LanguageContent} from './LanguageContent';
import {UntranslatedContent} from './UntranslatedContent';
import {LanguageModal} from './LanguageModal';
import * as LanguageGraphQL from './Language.gql-queries';
import * as LanguageHelper from './LanguageHelper';
import {LanguageSettingsContextProvider} from './LanguageSettings.context';

export const LanguageSettings = () => {
    const {t} = useTranslation('siteSettings');
    const {site, uilang} = useSelector(state => ({site: state.site, uilang: state.uilang}), shallowEqual);
    const res = useNodeChecks({path: `/sites/${site}`, uilang}, {requiredPermission: 'siteAdminLanguages'});

    const {data, loading, error} = useQuery(LanguageGraphQL.gqlGetSiteLanguages, {
        variables: {
            path: `/sites/${site}`,
            displayLanguage: uilang
        },
        skip: !site
    });

    const [selectedLanguage, setSelectedLanguage] = useState(LanguageHelper.emptyLanguage);
    const [modalOpen, setModalOpen] = useState(false);

    if (!res?.checksResult || error) {
        // TODO: Implement a user feedback button / information
        return '';
    }

    const allowsUnlistedLanguages = data?.jcr?.result?.site?.allowsUnlistedLanguages?.booleanValue;
    const mixLanguage = data?.jcr?.result?.site?.mixLanguage?.booleanValue;
    const untranslatedValue = () => {
        if (allowsUnlistedLanguages && mixLanguage) {
            return 'all';
        }

        if (mixLanguage) {
            return 'only';
        }

        return 'never';
    };

    const defaultLanguage = data?.jcr?.result?.site?.defaultLanguage;
    const siteLocales = data?.jcr?.result?.site?.languages || [];

    const openModal = language => {
        setSelectedLanguage({...language, isNew: !language.language});
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    };

    return (
        <LanguageSettingsContextProvider site={site} uilang={uilang}>
            <LayoutContent isLoading={loading}
                           header={
                               <Header title={t('label.header', {siteName: data?.jcr?.result?.site?.displayName})}
                                       mainActions={[
                                           <Button key="addLanguage"
                                                   size="big"
                                                   color="accent"
                                                   icon={<Add/>}
                                                   label={t('label.table.actions.add')}
                                                   data-sel-role="addLanguage"
                                                   onClick={() => openModal(LanguageHelper.emptyLanguage)}/>
                                       ]}/>
                           }
                           content={
                               <>
                                   <LanguageModal selectedLanguage={selectedLanguage}
                                                  setSelectedLanguage={setSelectedLanguage}
                                                  isOpen={modalOpen}
                                                  closeModal={closeModal}
                                                  availableLocales={data?.admin?.availableLocales}
                                                  siteLocales={siteLocales}
                                                  defaultLanguage={defaultLanguage}/>
                                   <LanguageContent openModal={openModal}
                                                    siteLocales={siteLocales}
                                                    defaultLanguage={defaultLanguage}/>
                                   <UntranslatedContent value={untranslatedValue()}/>
                               </>
                           }/>
        </LanguageSettingsContextProvider>
    );
};
