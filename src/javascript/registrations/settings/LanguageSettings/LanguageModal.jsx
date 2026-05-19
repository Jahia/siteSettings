import React, {useEffect, useMemo, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {useTranslation} from 'react-i18next';
import {useMutation} from '@apollo/client';
import {Button, CheckboxGroup, CheckboxItem, Dropdown, Modal, ModalBody, ModalFooter, ModalHeader, Pill, Typography} from '@jahia/moonstone';
import styles from './LanguageSettings.scss';
import * as LanguageGraphQL from './Language.gql-queries';
import * as LanguageHelper from './LanguageHelper';
import {LanguageModalError} from './LanguageModalError';
import {useLanguageSettingsContext} from './LanguageSettings.context';

const availabilities = {
    inactive: {activeInEdit: false, activeInLive: false, mandatory: false},
    inactiveInLive: {activeInEdit: true, activeInLive: false, mandatory: false},
    active: {activeInEdit: true, activeInLive: true, mandatory: false},
    required: {activeInEdit: true, activeInLive: true, mandatory: true}
};
const defaultDisabledValues = new Set(['inactive', 'inactiveInLive']);

export const LanguageModal = ({
    selectedLanguage,
    setSelectedLanguage,
    isOpen,
    closeModal,
    availableLocales,
    siteLocales,
    defaultLanguage
}) => {
    const {t} = useTranslation('siteSettings');
    const {site, uilang} = useLanguageSettingsContext();

    const [modalErrorDescription, setModalErrorDescription] = useState(null);

    // Reset transient modal state when the modal transitions from open -> closed.
    const wasOpenRef = useRef(isOpen);
    useEffect(() => {
        if (wasOpenRef.current && !isOpen) {
            setSelectedLanguage(LanguageHelper.emptyLanguage);
            setModalErrorDescription(null);
        }

        wasOpenRef.current = isOpen;
    }, [isOpen, setSelectedLanguage]);

    const onClose = () => {
        setSelectedLanguage(LanguageHelper.emptyLanguage);
        closeModal();
    };

    const availabilityData = useMemo(
        () => Object.keys(availabilities).map(value => ({
            value,
            label: t(`label.availability.${value}.title`),
            description: t(`label.availability.${value}.description`),
            isDisabled: defaultDisabledValues.has(value) && selectedLanguage.language === defaultLanguage
        })),
        [t, selectedLanguage.language, defaultLanguage]
    );

    const [gqlSaveSiteLanguages, {loading: isSavingSiteLanguages}] = useMutation(LanguageGraphQL.gqlSaveSiteLanguages,
        {
            refetchQueries: [{
                query: LanguageGraphQL.gqlGetSiteLanguages,
                variables: {path: `/sites/${site}`, displayLanguage: uilang}
            }],
            awaitRefetchQueries: true,
            onCompleted: closeModal,
            onError: err => {
                console.error(err);
                setModalErrorDescription(t('label.modal.error.description'));
            }
        });

    const save = (updatedLanguage, addLanguage) => {
        const updatedLocales = addLanguage ?
            [...siteLocales, updatedLanguage] :
            siteLocales.map(l => l.language === updatedLanguage.language ? updatedLanguage : l);

        gqlSaveSiteLanguages({variables: LanguageHelper.buildLanguageVariables(`/sites/${site}`, updatedLocales)});
    };

    const dropDownData = useMemo(() => availableLocales.map(l => {
        return {
            iconEnd: <Pill label={l.language.toUpperCase()}/>,
            id: l.language,
            label: l.displayName,
            value: l.language,
            isDisabled: siteLocales.some(lang => lang.language === l.language)
        };
    }), [availableLocales, siteLocales]);

    return (
        <Modal isOpen={isOpen}>
            <ModalHeader
                title={t('label.modal.header', {action: selectedLanguage.language ? t('label.actions.edit') : t('label.actions.add')})}/>
            <ModalBody>
                <LanguageModalError isOpen={modalErrorDescription !== null}
                                    closeModal={() => setModalErrorDescription(null)}
                                    description={modalErrorDescription}/>
                <div className={styles.field}>
                    <Typography variant="subheading">{t('label.modal.language.title')}</Typography>
                    <Dropdown className={styles.dropdown}
                              placeholder={t('label.modal.language.placeholder')}
                              variant="outlined"
                              isDisabled={!selectedLanguage.isNew}
                              value={selectedLanguage.language}
                              data-sel-role="languages"
                              data={dropDownData}
                              onChange={(e, v) => setSelectedLanguage({
                                  ...selectedLanguage,
                                  language: v.value,
                                  displayName: v.label
                              })}/>
                </div>

                <div className={styles.field}>
                    <CheckboxGroup isReadOnly name="default">
                        <CheckboxItem id={defaultLanguage}
                                      label={t('label.modal.default')}
                                      checked={selectedLanguage.language === defaultLanguage}/>
                    </CheckboxGroup>
                </div>

                <div className={styles.field}>
                    <Typography variant="subheading">{t('label.modal.availability.title')}</Typography>
                    <Dropdown data-sel-role="availability"
                              data={availabilityData}
                              placeholder={t('label.modal.availability.placeholder')}
                              variant="outlined"
                              className={styles.dropdown}
                              value={LanguageHelper.getAvailability(selectedLanguage)}
                              onChange={(e, v) => {
                                  const flags = availabilities[v.value];
                                  if (!flags) {
                                      return;
                                  }

                                  setSelectedLanguage({...selectedLanguage, ...flags});
                              }}/>
                </div>
            </ModalBody>
            <ModalFooter>
                <Button size="big"
                        variant="ghost"
                        label={t('label.actions.cancel')}
                        data-sel-role="cancel"
                        onClick={onClose}/>
                {selectedLanguage.isNew ?
                    <Button size="big"
                            isDisabled={isSavingSiteLanguages || !selectedLanguage.language || !selectedLanguage.displayName}
                            color="accent"
                            label={t('label.actions.add')}
                            data-sel-role="add"
                            onClick={() => save(selectedLanguage, true)}/> :
                    <Button size="big"
                            color="accent"
                            label={t('label.actions.save')}
                            data-sel-role="save"
                            isDisabled={isSavingSiteLanguages}
                            onClick={() => save(selectedLanguage, false)}/>}
            </ModalFooter>
        </Modal>
    );
};

LanguageModal.propTypes = {
    selectedLanguage: PropTypes.shape({
        isNew: PropTypes.bool.isRequired,
        language: PropTypes.string, // Optional until selected
        displayName: PropTypes.string, // Optional until selected
        activeInEdit: PropTypes.bool.isRequired,
        activeInLive: PropTypes.bool.isRequired,
        mandatory: PropTypes.bool.isRequired
    }).isRequired,
    setSelectedLanguage: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    availableLocales: PropTypes.arrayOf(PropTypes.shape({
        language: PropTypes.string.isRequired,
        displayName: PropTypes.string.isRequired
    })).isRequired,
    siteLocales: PropTypes.arrayOf(PropTypes.shape({
        language: PropTypes.string.isRequired,
        displayName: PropTypes.string.isRequired,
        activeInEdit: PropTypes.bool,
        activeInLive: PropTypes.bool,
        mandatory: PropTypes.bool,
        count: PropTypes.number
    })).isRequired,
    defaultLanguage: PropTypes.string // Can be undefined while loading
};
