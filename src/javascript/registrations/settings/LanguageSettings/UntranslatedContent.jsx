import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {useTranslation} from 'react-i18next';
import {useMutation} from '@apollo/client';
import {Button, Edit, Modal, ModalBody, ModalFooter, ModalHeader, Paper, RadioGroup, RadioItem, Typography} from '@jahia/moonstone';
import styles from './LanguageSettings.scss';
import * as LanguageGraphQL from './Language.gql-queries';
import {LanguageModalError} from './LanguageModalError';
import {useLanguageSettingsContext} from './LanguageSettings.context';

export const UntranslatedContent = ({value}) => {
    const {t} = useTranslation('siteSettings');
    const {site, uilang} = useLanguageSettingsContext();

    const [modalErrorDescription, setModalErrorDescription] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const openModal = () => {
        setUntranslatedValue(value);
        setModalOpen(true);
    };

    const closeModal = () => setModalOpen(false);

    const [untranslatedValue, setUntranslatedValue] = useState(value);
    const [gqlSaveSiteLanguageOptions, {loading: isSavingSiteLanguagesOptions}] = useMutation(LanguageGraphQL.gqlSaveSiteLanguageOptions,
        {
            refetchQueries: [{
                query: LanguageGraphQL.gqlGetSiteLanguages,
                variables: {path: `/sites/${site}`, displayLanguage: uilang}
            }],
            awaitRefetchQueries: true,
            onCompleted: () => closeModal(),
            onError: err => {
                console.error(err);
                setModalErrorDescription(t('label.modal.error.description'));
            }
        });

    const save = () => {
        const options = {
            never: {mixLanguage: false, allowsUnlistedLanguages: false},
            only: {mixLanguage: true, allowsUnlistedLanguages: false},
            all: {mixLanguage: true, allowsUnlistedLanguages: true}
        };
        gqlSaveSiteLanguageOptions({
            variables: {
                path: `/sites/${site}`,
                ...options[untranslatedValue]
            }
        });
    };

    return (
        <>
            <Modal isOpen={modalOpen} size="large">
                <ModalHeader title={t('label.untranslatedContent.modal')}/>
                <ModalBody>
                    <LanguageModalError isOpen={modalErrorDescription !== null}
                                        closeModal={() => setModalErrorDescription(null)}
                                        description={modalErrorDescription}/>
                    <Typography variant="heading">{t('label.untranslatedContent.title')}</Typography>
                    <RadioGroup name="values"
                                className={styles.spacingSmall}
                                value={untranslatedValue}
                                onChange={(e, v) => setUntranslatedValue(v)}
                    >
                        <RadioItem id="never" label={t('label.untranslatedContent.never')} value="never"/>
                        <RadioItem id="only" label={t('label.untranslatedContent.only')} value="only"/>
                        <RadioItem id="all" label={t('label.untranslatedContent.all')} value="all"/>
                    </RadioGroup>
                </ModalBody>
                <ModalFooter>
                    <Button size="big"
                            variant="ghost"
                            label={t('label.actions.cancel')}
                            onClick={closeModal}/>
                    <Button size="big"
                            color="accent"
                            label={t('label.actions.save')}
                            data-sel-role="save"
                            isDisabled={isSavingSiteLanguagesOptions}
                            onClick={save}/>
                </ModalFooter>
            </Modal>

            <Paper>
                <Button variant="outlined"
                        color="accent"
                        icon={<Edit/>}
                        label={t('label.actions.edit')}
                        data-sel-role="edit"
                        className={styles.btnUntranslatedContent}
                        onClick={openModal}/>
                <Typography variant="heading">{t('label.untranslatedContent.title')}</Typography>
                <div className={styles.spacingSmall}>
                    <Typography data-sel-role="untranslatedContent-value"
                                data-value={value}
                    >{t(`label.untranslatedContent.${value}`)}
                    </Typography>
                </div>
            </Paper>
        </>
    );
};

UntranslatedContent.propTypes = {
    value: PropTypes.string.isRequired
};
